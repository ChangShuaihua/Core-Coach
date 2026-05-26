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
import { getStoredState } from './http'

const WS_URL = 'ws://192.168.10.7:8083/api/v1/ws/connect'
const PING_INTERVAL = 30_000
const PONG_TIMEOUT = 90_000
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
  private lastStreamId = ''
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
    this._state = 'connecting'
    this.reconnectAttempts = 0
    this.doConnect(token, userId)
  }

  private doConnect(token: string, userId: string): void {
    console.log('[WS] connecting...')

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
      token: token || accessToken,
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

  private handleDisconnect(token: string, userId: string): void {
    this.stopHeartbeat()
    this._state = 'disconnected'
    this.emit('disconnect', { reason: 'connection_lost' })
    this.scheduleReconnect(token, userId)
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

    switch (event_type) {
      case 'connected':
        this._state = 'authenticated'
        this.reconnectAttempts = 0
        this.startHeartbeat()
        console.log('[WS] authenticated')
        if (this.lastStreamId && this.currentSessionId) {
          this.sendReconnect()
        }
        break

      case 'auth_failed':
        console.error('[WS] auth_failed:', data)
        this._state = 'disconnected'
        break

      case 'pong':
        if (this.pongTimer) {
          clearTimeout(this.pongTimer)
          this.pongTimer = null
        }
        break

      case 'stream_chunk':
        this.lastStreamId = data.stream_id
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

  sendChat(data: WsChatData): void {
    this.send('chat', data)
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
    this.reconnectAttempts = 0
    this.pendingAborts.clear()
  }

  private sendReconnect(): void {
    const { accessToken } = getStoredState()
    const data: WsReconnectData = {
      user_id: '',
      token: accessToken,
      last_stream_id: this.lastStreamId,
      session_id: this.currentSessionId,
    }
    this.send('reconnect', data)
  }

  generateRequestId(): string {
    return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

export const ws = new WsManager()
