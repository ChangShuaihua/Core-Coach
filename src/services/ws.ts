import Taro from '@tarojs/taro'
import type {
  WsMessage,
  WsEventType,
  WsConnectionState,
  WsAuthData,
  WsChatData,
  WsSessionSwitchData,
  WsAbortData,
  WsReconnectData,
  WsDisconnectData,
  WsPingData,
  WsAbortResultData,
} from '@/types/ws'
import { getStoredState, refreshTokenIfNeeded } from './http'

const WS_URL = 'ws://192.168.10.7:8083/api/v1/ws/connect'
const PING_INTERVAL = 30_000
const PONG_TIMEOUT = 10_000
const RECONNECT_BASE_DELAY = 1_000
const RECONNECT_MAX_DELAY = 30_000

type EventHandler = (data: any) => void

class WsManager {
  private socketTask: Taro.SocketTask | null = null
  private _state: WsConnectionState = 'disconnected'
  private handlers = new Map<WsEventType, Set<EventHandler>>()
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private pongTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private currentSessionId = ''
  private lastStreamIds: Record<string, string> = {}
  private token = ''
  private userId = ''
  private intentionalClose = false
  private isReconnecting = false
  private pendingAborts = new Map<string, (data: WsAbortResultData) => void>()

  // ============ 状态 ============

  get state(): WsConnectionState {
    return this._state
  }

  get connected(): boolean {
    return this._state === 'authenticated'
  }

  get sessionId(): string {
    return this.currentSessionId
  }

  private canSend(): boolean {
    return this._state === 'authenticated' && !!this.socketTask
  }

  // ============ 事件订阅 ============

  on(event: WsEventType, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  off(event: WsEventType, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  private emit(event: WsEventType, data: any): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data)
      } catch (e) {
        console.error(`[WS] event handler error for ${event}:`, e)
      }
    })
  }

  // ============ 连接 ============

  connect(token: string, userId: string): void {
    if (this._state === 'connecting' || this._state === 'authenticated') {
      return
    }
    this.token = token
    this.userId = userId
    this.intentionalClose = false
    this.isReconnecting = false
    this._state = 'connecting'
    this.reconnectAttempts = 0
    this.doConnect(token, userId)
  }

  private doConnect(token: string, userId: string): void {
    console.log('[WS] connecting...')

    // 关闭旧连接，防止微信 5 并发限制
    if (this.socketTask) {
      try {
        this.socketTask.close({})
      } catch {}
      this.socketTask = null
    }

    Taro.connectSocket({
      url: WS_URL,
      success: () => console.log('[WS] connectSocket success'),
      fail: (err) => {
        console.error('[WS] connectSocket fail:', err)
        this._state = 'disconnected'
        this.scheduleReconnect(token, userId)
      },
    }).then((task) => {
      this.socketTask = task
      task.onOpen(() => {
        console.log('[WS] onOpen')
        this._state = 'connected'
        this.sendAuth(token, userId)
      })
      task.onMessage((res) => {
        this.handleMessage(res.data as string)
      })
      task.onClose((res) => {
        console.log('[WS] onClose:', res?.code, res?.reason)
        this.handleDisconnect(token, userId)
      })
      task.onError((err) => {
        console.error('[WS] onError:', err)
        this.handleDisconnect(token, userId)
      })
    })
  }

  // ============ 认证 ============

  private sendAuth(token: string, userId: string): void {
    const { accessToken } = getStoredState()
    const authData: WsAuthData = {
      user_id: userId,
      token: accessToken || token,
    }
    this.send('auth', authData)
  }

  // ============ 心跳 ============

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.pingTimer = setInterval(() => {
      if (this._state !== 'authenticated') return
      const pingData: WsPingData = {
        timestamp: Math.floor(Date.now() / 1000),
        session_id: this.currentSessionId,
      }
      this.send('ping', pingData)
      if (this.pongTimer) {
        clearTimeout(this.pongTimer)
        this.pongTimer = null
      }
      this.pongTimer = setTimeout(() => {
        console.warn('[WS] pong timeout, reconnecting...')
        this.socketTask?.close({})
      }, PONG_TIMEOUT)
    }, PING_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }
  }

  // ============ 断线重连 ============

  private async handleDisconnect(token: string, userId: string): Promise<void> {
    this.stopHeartbeat()
    this._state = 'disconnected'
    if (this.intentionalClose) {
      this.intentionalClose = false
      console.log('[WS] intentional close, skip reconnect')
      return
    }
    // 防止 onClose 和 onError 同时触发重复重连
    if (this.isReconnecting) return
    this.isReconnecting = true

    this.emit('disconnect', { reason: 'connection_lost' })

    // 断连后先刷新 token，确保重连用最新 token
    try {
      await refreshTokenIfNeeded()
    } catch {
      console.warn('[WS] token refresh failed, retry with current token')
    }
    const { accessToken } = getStoredState()
    const latestToken = accessToken || token
    if (latestToken !== this.token) {
      this.token = latestToken
    }
    this.scheduleReconnect(latestToken, userId)
  }

  private scheduleReconnect(token: string, userId: string): void {
    if (this.reconnectTimer) return
    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    )
    this.reconnectAttempts++
    console.log(`[WS] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.doConnect(token, userId)
    }, delay)
  }

  // ============ 消息处理 ============

  private handleMessage(raw: string): void {
    let msg: WsMessage
    try {
      msg = JSON.parse(raw)
    } catch {
      console.error('[WS] invalid JSON:', raw)
      return
    }

    const { event_type, data } = msg
    console.log(
      '[WS] received event:',
      event_type,
      data?.session_id ? `session_id: ${data.session_id}` : ''
    )

    switch (event_type) {
      case 'connected':
        this._state = 'authenticated'
        this.reconnectAttempts = 0
        this.isReconnecting = false
        this.startHeartbeat()
        console.log('[WS] authenticated')
        if (Object.keys(this.lastStreamIds).length > 0) {
          this.sendReconnect()
        }
        break

      case 'auth_failed':
        console.error('[WS] auth_failed:', data)
        this._state = 'disconnected'
        // 不自行重试，关闭连接让 onClose → handleDisconnect 走统一的 refresh+reconnect 流程
        if (!this.intentionalClose) {
          this.socketTask?.close({})
        }
        break

      case 'pong':
        if (this.pongTimer) {
          clearTimeout(this.pongTimer)
          this.pongTimer = null
        }
        break

      case 'stream_chunk':
        if (data.session_id) {
          this.lastStreamIds[data.session_id] = data.stream_id
        }
        break

      case 'abort_result':
        {
          const resolver = this.pendingAborts.get(data.request_id)
          if (resolver) {
            resolver(data)
            this.pendingAborts.delete(data.request_id)
          }
        }
        break
    }

    this.emit(event_type, data)
  }

  // ============ 发送消息 ============

  private send(event_type: WsEventType, data: any): void {
    if (!this.socketTask) {
      console.warn('[WS] no socket task, cannot send')
      return
    }
    const msg: WsMessage = { event_type, data }
    this.socketTask.send({
      data: JSON.stringify(msg),
      fail: (err) => console.error(`[WS] send ${event_type} failed:`, err),
    })
  }

  // ============ 公共 API ============

  sendChat(data: WsChatData): boolean {
    if (!this.canSend()) {
      console.warn('[WS] cannot send chat, state:', this._state)
      this.tryReconnect()
      return false
    }
    this.send('chat', data)
    return true
  }

  private tryReconnect(): void {
    if (this._state === 'connecting' || this._state === 'authenticated') return
    const { accessToken } = getStoredState()
    const token = accessToken || this.token
    if (!token || !this.userId) {
      console.warn('[WS] cannot reconnect: no token or userId')
      return
    }
    this._state = 'disconnected'
    this.scheduleReconnect(token, this.userId)
  }

  switchSession(oldSessionId: string, newSessionId: string): void {
    const data: WsSessionSwitchData = {
      request_id: this.generateRequestId(),
      old_session_id: oldSessionId,
      new_session_id: newSessionId,
      switch_reason: 'user_initiated',
      create_time: Math.floor(Date.now() / 1000),
    }
    this.currentSessionId = newSessionId
    this.send('session_switch', data)
  }

  sendAbort(sessionId: string, requestId: string): Promise<WsAbortResultData> {
    return new Promise((resolve) => {
      if (!this.canSend()) {
        resolve({
          request_id: requestId,
          session_id: sessionId,
          success: false,
          stopped_at_chunk: 0,
          message: '连接不可用',
          create_time: Math.floor(Date.now() / 1000),
        })
        return
      }
      this.pendingAborts.set(requestId, resolve)
      const data: WsAbortData = {
        request_id: requestId,
        session_id: sessionId,
        reason: 'user_cancelled',
        create_time: Math.floor(Date.now() / 1000),
      }
      this.send('abort', data)
      setTimeout(() => {
        if (this.pendingAborts.has(requestId)) {
          this.pendingAborts.delete(requestId)
          resolve({
            request_id: requestId,
            session_id: sessionId,
            success: true,
            stopped_at_chunk: 0,
            message: '中断超时',
            create_time: Math.floor(Date.now() / 1000),
          })
        }
      }, 5000)
    })
  }

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId
  }

  disconnect(): void {
    this.intentionalClose = true
    if (this.currentSessionId) {
      const data: WsDisconnectData = {
        session_id: this.currentSessionId,
        reason: 'user_leaving',
        create_time: Math.floor(Date.now() / 1000),
      }
      this.send('disconnect', data)
    }
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socketTask?.close({})
    this.socketTask = null
    this._state = 'disconnected'
    this.isReconnecting = false
    this.reconnectAttempts = 0
    this.pendingAborts.clear()
    this.lastStreamIds = {}
  }

  private sendReconnect(): void {
    const { accessToken } = getStoredState()
    // 使用当前 session 的 lastStreamId（向后兼容）
    const lastStreamId = this.lastStreamIds[this.currentSessionId] || ''
    const data: WsReconnectData = {
      request_id: this.generateRequestId(),
      user_id: this.userId,
      token: accessToken || this.token,
      last_stream_id: lastStreamId,
      session_id: this.currentSessionId,
    }
    this.send('reconnect', data)
  }

  generateRequestId(): string {
    return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

export const ws = new WsManager()
