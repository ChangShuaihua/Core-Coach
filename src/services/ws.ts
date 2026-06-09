import Taro from '@tarojs/taro'
import type {
  WsMessage,
  WsEventType,
  WsConnectionState,
  WsReconnectData,
  WsDisconnectData,
  WsPingData,
} from '@/types/ws'
import { getStoredState, refreshTokenIfNeeded } from './http'

const WS_URL = process.env.TARO_APP_WS_URL || ''
if (!WS_URL) {
  console.warn('[WS] TARO_APP_WS_URL 未配置，请检查 .env 文件')
}
const PING_INTERVAL = 30_000
const PONG_TIMEOUT = 10_000
const RECONNECT_BASE_DELAY = 1_000
const RECONNECT_MAX_DELAY = 30_000

type EventHandler = (data: any) => void

export interface ReconnectSession {
  sessionId: string
  lastStreamId: string
}

export interface ReconnectContext {
  currentSessionId: string
  sessions: ReconnectSession[]
}

/**
 * WebSocket 纯连接层
 * 职责：连接/断开/重连/认证/心跳/发送原始事件/事件分发
 * 业务逻辑（sendChat/sendAbort/lastStreamIds/pendingAborts）由 chatStore 管理
 */
class WsManager {
  private socketTask: Taro.SocketTask | null = null
  private _state: WsConnectionState = 'disconnected'
  private handlers = new Map<WsEventType, Set<EventHandler>>()
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private pongTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private token = ''
  private intentionalClose = false
  private authFailed = false
  private authRecovering = false
  private connectionId = 0
  private isOnline = true

  // chatStore 注入的 getter
  private _getReconnectContext: (() => ReconnectContext) | null = null

  // ============ 状态 ============

  get state(): WsConnectionState {
    return this._state
  }

  get connected(): boolean {
    return this._state === 'authenticated'
  }

  // ============ 注入回调 ============

  setReconnectContextGetter(getter: () => ReconnectContext): void {
    this._getReconnectContext = getter
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

  /** 将错过的消息重新注入事件系统，复用已有 handler */
  reemit(messages: Array<{ event_type: WsEventType; data: any }>): void {
    for (const msg of messages) {
      this.emit(msg.event_type, msg.data)
    }
  }

  // ============ 连接 ============

  connect(token: string): void {
    if (this._state === 'authenticated') return

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.token = token
    this.intentionalClose = false
    this.authFailed = false
    this._state = 'connecting'
    this.reconnectAttempts = 0
    this.doConnect(token)
  }

  private doConnect(token: string): void {
    const connId = ++this.connectionId
    console.log('[WS] connecting...', `conn#${connId}`)

    if (this.socketTask) {
      try {
        this.socketTask.close({})
      } catch {}
      this.socketTask = null
    }

    Taro.connectSocket({
      url: WS_URL,
      success: () => console.log('[WS] connectSocket success', `conn#${connId}`),
      fail: (err) => {
        console.error('[WS] connectSocket fail:', err)
        if (connId !== this.connectionId) return
        this._state = 'disconnected'
        this.scheduleReconnect(token)
      },
    }).then((task) => {
      if (connId !== this.connectionId) return
      this.socketTask = task

      task.onOpen(() => {
        if (connId !== this.connectionId) return
        console.log('[WS] onOpen', `conn#${connId}`)
        this._state = 'connected'
        this.sendAuth(token)
      })
      task.onMessage((res) => {
        if (connId !== this.connectionId) return
        this.handleMessage(res.data as string)
      })

      let disconnected = false
      const onDisconnect = (reason: string) => {
        if (connId !== this.connectionId) return
        if (disconnected) return
        disconnected = true
        console.log(`[WS] ${reason}`, `conn#${connId}`)
        this.handleDisconnect(token)
      }

      task.onClose((res) => {
        onDisconnect(`onClose: ${res?.code} ${res?.reason}`)
      })
      task.onError((err) => {
        onDisconnect(`onError: ${JSON.stringify(err)}`)
      })
    })
  }

  // ============ 认证 ============

  private sendAuth(token: string): void {
    this.send('auth', { token })
  }

  private async forceRefreshAccessToken(): Promise<string> {
    const { refreshToken: refreshTokenStr } = getStoredState()
    if (!refreshTokenStr) throw new Error('refreshToken 不存在')

    const [{ refreshToken: refreshFn }, { useUserStore }] = await Promise.all([
      import('@/api/login'),
      import('@/store/useUserStore'),
    ])
    const result = await refreshFn(refreshTokenStr)
    const store = useUserStore.getState()
    store.setAccessToken(result.accessToken)
    store.setRefreshToken(result.refreshToken)
    store.setAccessExpireTime(result.accessExpire)
    store.setRefreshExpireTime(result.refreshExpire)
    return result.accessToken
  }

  private async resolveLatestToken(fallbackToken = ''): Promise<string> {
    try {
      await refreshTokenIfNeeded()
    } catch {
      console.warn('[WS] token refresh check failed, using latest stored token if available')
    }

    const { accessToken } = getStoredState()
    return accessToken || fallbackToken || this.token
  }

  private async reconnectWithLatestToken(fallbackToken = ''): Promise<void> {
    if (!this.isOnline) {
      console.log('[WS] offline, skip reconnectWithLatestToken')
      return
    }

    const latestToken = await this.resolveLatestToken(fallbackToken)
    if (!latestToken) {
      console.warn('[WS] cannot reconnect: no token')
      return
    }

    this.token = latestToken
    this.authFailed = false
    this.intentionalClose = false
    this.doConnect(latestToken)
  }

  private async recoverFromAuthExpired(data: { retry_after?: number } | undefined): Promise<void> {
    if (this.authRecovering) return
    this.authRecovering = true
    this.authFailed = true
    this._state = 'disconnected'
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    try {
      this.socketTask?.close({})
    } catch {}

    try {
      const storedToken = getStoredState().accessToken
      const latestToken =
        storedToken && storedToken !== this.token
          ? storedToken
          : await this.forceRefreshAccessToken()

      this.token = latestToken
      this.authFailed = false
      this.reconnectAttempts = 0
      this.doConnect(latestToken)
    } catch (err) {
      console.warn('[WS] auth token recovery failed:', err)
      const retryAfter = Number(data?.retry_after)
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        this.scheduleReconnect(this.token, retryAfter * 1000)
      }
    } finally {
      this.authRecovering = false
    }
  }

  // ============ 心跳 ============

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.pingTimer = setInterval(() => {
      if (this._state !== 'authenticated') return
      const pingData: WsPingData = {
        timestamp: Math.floor(Date.now() / 1000),
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

  private async handleDisconnect(token: string): Promise<void> {
    this.stopHeartbeat()
    this._state = 'disconnected'
    if (this.authFailed) {
      this.authFailed = false
      console.log('[WS] auth failed, skip reconnect')
      return
    }
    if (this.intentionalClose) {
      this.intentionalClose = false
      console.log('[WS] intentional close, skip reconnect')
      return
    }

    if (!this.isOnline) {
      console.log('[WS] offline, skip reconnect')
      this.emit('disconnect', { reason: 'offline' })
      return
    }

    this.emit('disconnect', { reason: 'connection_lost' })

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
    this.scheduleReconnect(latestToken)
  }

  private scheduleReconnect(token: string, delayOverride?: number): void {
    if (this.reconnectTimer) return
    if (!this.isOnline) {
      console.log('[WS] offline, skip scheduleReconnect')
      return
    }
    const delay =
      delayOverride ??
      Math.min(RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts), RECONNECT_MAX_DELAY)
    this.reconnectAttempts++
    console.log(`[WS] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectWithLatestToken(token)
    }, delay)
  }

  // ============ 消息处理（连接层：只处理连接相关事件） ============

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
        this.authFailed = false
        this.startHeartbeat()
        console.log('[WS] authenticated')
        // 有活跃 stream 时发送重连恢复
        {
          const ctx = this._getReconnectContext?.()
          if (ctx && ctx.sessions.length > 0) {
            this.sendReconnect(ctx)
          }
        }
        break

      case 'auth_failed':
        console.error('[WS] auth_failed:', data)
        if (data?.code === 401) {
          this.recoverFromAuthExpired(data)
          break
        }
        this.authFailed = true
        this._state = 'disconnected'
        this.socketTask?.close({})
        break

      case 'pong':
        if (this.pongTimer) {
          clearTimeout(this.pongTimer)
          this.pongTimer = null
        }
        break
    }

    // 所有事件（包括业务事件）都 emit 出去，由 chatWsHandlers 处理
    this.emit(event_type, data)
  }

  // ============ 发送消息 ============

  send(event_type: WsEventType, data: any): void {
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

  canSend(): boolean {
    return this._state === 'authenticated' && !!this.socketTask
  }

  tryReconnect(): void {
    if (this._state === 'connecting' || this._state === 'authenticated') return
    const { accessToken } = getStoredState()
    const token = accessToken || this.token
    if (!token) {
      console.warn('[WS] cannot reconnect: no token')
      return
    }
    this._state = 'disconnected'
    this.scheduleReconnect(token)
  }

  disconnect(): void {
    this.intentionalClose = true
    const data: WsDisconnectData = {
      reason: 'user_leaving',
      create_time: Math.floor(Date.now() / 1000),
    }
    this.send('disconnect', data)
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socketTask?.close({})
    this.socketTask = null
    this._state = 'disconnected'
    this.reconnectAttempts = 0
    this.authFailed = false
  }

  private sendReconnect(ctx: ReconnectContext): void {
    const { accessToken } = getStoredState()
    const data: WsReconnectData = {
      token: accessToken || this.token,
      sessions: ctx.sessions.map((s) => ({
        session_id: s.sessionId,
        last_stream_id: s.lastStreamId,
      })),
    }
    this.send('reconnect', data)
  }

  // ============ 断网感知 ============

  initNetworkListener(): void {
    Taro.getNetworkType({
      success: (res) => {
        this.isOnline = res.networkType !== 'none'
      },
    })
    Taro.onNetworkStatusChange((res) => {
      const wasOnline = this.isOnline
      this.isOnline = res.isConnected

      if (!wasOnline && res.isConnected) {
        console.log('[WS] network restored, checking connection...')
        if (this._state === 'disconnected' && this.token) {
          this.reconnectAttempts = 0
          this.reconnectWithLatestToken(this.token)
        }
      } else if (!res.isConnected) {
        console.log('[WS] network lost')
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }
    })
  }

  generateRequestId(): string {
    return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

export const ws = new WsManager()
