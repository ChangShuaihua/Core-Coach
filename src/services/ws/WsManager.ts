import Taro from '@tarojs/taro'
import type {
  WsEventType,
  WsConnectionState,
  WsReconnectData,
  WsDisconnectData,
  WsPingData,
} from '@/types/ws'
import { checkAndRefreshToken, forceRefreshToken, getStoredState } from '../http'
import {
  PING_INTERVAL,
  PONG_TIMEOUT,
  RECONNECT_COOLDOWN_MS,
  RECONNECT_MAX_ATTEMPTS,
  WS_URL,
} from './constants'
import { parseWsMessage, stringifyWsMessage } from './message'
import { getReconnectDelay } from './reconnect'
import type {
  DisconnectOptions,
  ReconnectContext,
  SendOptions,
  WsEventHandler,
  WsHandlerMap,
} from './types'

if (!WS_URL) {
  console.warn('[WS] TARO_APP_WS_URL 未配置，请检查 .env 文件')
}

/**
 * WebSocket 纯连接层
 * 职责：连接/断开/重连/认证/心跳/发送原始事件/事件分发
 * 业务逻辑（sendChat/sendAbort/lastStreamIds/pendingAborts）由 chatStore 管理
 */
export class WsManager {
  private socketTask: Taro.SocketTask | null = null
  private _state: WsConnectionState = 'disconnected'
  private handlers: WsHandlerMap = new Map()
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
  private reconnectStoppedUntil = 0

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

  on(event: WsEventType, handler: WsEventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  off(event: WsEventType, handler: WsEventHandler): void {
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

  private hasLocalAuth(): boolean {
    const { accessToken, refreshToken } = getStoredState()
    return !!accessToken && !!refreshToken
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private closeSocketTask(task: Taro.SocketTask | null = this.socketTask): void {
    if (!task) return
    try {
      task.close({
        fail: () => {},
      })
    } catch {}
  }

  private canReconnect(token = this.token): boolean {
    return this.isOnline && !!token && this.hasLocalAuth()
  }

  private isReconnectCoolingDown(): boolean {
    return Date.now() < this.reconnectStoppedUntil
  }

  private stopReconnectTemporarily(reason: string): void {
    this.reconnectStoppedUntil = Date.now() + RECONNECT_COOLDOWN_MS
    this.clearReconnectTimer()
    console.warn(`[WS] reconnect paused: ${reason}`)
  }

  /** 将错过的消息重新注入事件系统，复用已有 handler */
  reemit(messages: Array<{ event_type: WsEventType; data: any }>): void {
    for (const msg of messages) {
      this.emit(msg.event_type, msg.data)
    }
  }

  // ============ 连接 ============

  connect(token: string): void {
    if (!token || !this.hasLocalAuth()) return
    if (this._state === 'connecting' || this._state === 'authenticated') return

    this.clearReconnectTimer()

    this.token = token
    this.intentionalClose = false
    this.authFailed = false
    this._state = 'connecting'
    this.reconnectAttempts = 0
    this.reconnectStoppedUntil = 0
    this.doConnect(token)
  }

  private doConnect(token: string): void {
    if (!token || !this.hasLocalAuth()) return
    if (this._state === 'connecting' && this.socketTask) return
    if (this._state === 'authenticated') return

    const connId = ++this.connectionId
    console.log('[WS] connecting...', `conn#${connId}`)

    if (this.socketTask) {
      this.closeSocketTask()
      this.socketTask = null
    }

    this._state = 'connecting'
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
      if (connId !== this.connectionId) {
        this.closeSocketTask(task)
        return
      }
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
        if (this.socketTask === task) {
          this.socketTask = null
        }
        console.log(`[WS] ${reason}`, `conn#${connId}`)
        this.handleDisconnect()
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
    this.send('auth', { token }, { requireAuth: false })
  }

  private async resolveLatestToken(fallbackToken = ''): Promise<string> {
    if (!this.hasLocalAuth()) return ''
    const refreshResult = await checkAndRefreshToken()
    if (!refreshResult.ok) {
      if (refreshResult.status === 'missing-auth' || refreshResult.status === 'refresh-expired') {
        return ''
      }
      console.warn('[WS] token refresh check failed, using latest stored token if available')
    }

    const { accessToken } = getStoredState()
    return accessToken || fallbackToken || this.token
  }

  private async reconnectWithLatestToken(fallbackToken = ''): Promise<void> {
    if (this._state === 'connecting' || this._state === 'authenticated') return
    if (!this.canReconnect(fallbackToken || this.token)) {
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

    this.closeSocketTask()
    this.socketTask = null

    try {
      const storedToken = getStoredState().accessToken
      const latestToken =
        storedToken && storedToken !== this.token ? storedToken : await forceRefreshToken()

      this.token = latestToken
      this.authFailed = false
      this.reconnectAttempts = 0
      this.doConnect(latestToken)
    } catch (err) {
      console.warn('[WS] auth token recovery failed:', err)
      if (!this.hasLocalAuth()) return
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

  /** 后台 ping 探活，超时则触发重连。不阻塞调用方。 */
  ensureAlive(): void {
    if (this._state !== 'authenticated' || !this.socketTask) return

    this.send('ping', { timestamp: Math.floor(Date.now() / 1000) })

    const onPong = () => {
      this.off('pong', onPong)
      clearTimeout(timer)
    }
    this.on('pong', onPong)

    const timer = setTimeout(() => {
      this.off('pong', onPong)
      console.warn('[WS] ensureAlive: no pong, closing stale connection')
      this.socketTask?.close({})
    }, PONG_TIMEOUT)
  }

  // ============ 断线重连 ============

  private async handleDisconnect(): Promise<void> {
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

    const refreshResult = await checkAndRefreshToken()
    if (!refreshResult.ok && refreshResult.status !== 'temporary-failed') {
      console.warn(`[WS] token refresh stopped reconnect: ${refreshResult.status}`)
      return
    }
    const { accessToken } = getStoredState()
    const latestToken = accessToken
    if (!latestToken) return
    if (latestToken !== this.token) {
      this.token = latestToken
    }
    this.scheduleReconnect(latestToken)
  }

  private scheduleReconnect(token: string, delayOverride?: number): void {
    if (this.reconnectTimer) return
    if (this.isReconnectCoolingDown()) return
    if (!this.canReconnect(token)) {
      console.log('[WS] offline, skip scheduleReconnect')
      return
    }
    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      this.stopReconnectTemporarily('max attempts reached')
      return
    }
    const delay = getReconnectDelay(this.reconnectAttempts, delayOverride)
    this.reconnectAttempts++
    console.log(`[WS] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectWithLatestToken(token)
    }, delay)
  }

  // ============ 消息处理（连接层：只处理连接相关事件） ============

  private handleMessage(raw: string): void {
    const msg = parseWsMessage(raw)
    if (!msg) {
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
        this.reconnectStoppedUntil = 0
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
        if (data?.code === 429) {
          this.authFailed = true
          this._state = 'disconnected'
          this.stopHeartbeat()
          this.closeSocketTask()
          // 不自动重连，由业务层处理登出
          break
        }
        this.authFailed = true
        this._state = 'disconnected'
        this.stopReconnectTemporarily(`auth_failed:${data?.code ?? 'unknown'}`)
        this.closeSocketTask()
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

  send(event_type: WsEventType, data: any, options: SendOptions = {}): boolean {
    const { requireAuth = true, quiet = false, reconnectOnFail = true } = options

    if (!this.socketTask || (requireAuth && !this.canSend())) {
      if (!quiet) {
        console.warn(`[WS] skip ${event_type}: socket is not ready`, {
          state: this._state,
          hasSocketTask: !!this.socketTask,
        })
      }
      if (reconnectOnFail && this._state === 'disconnected') {
        this.tryReconnect()
      } else if (reconnectOnFail && this._state === 'authenticated' && !this.socketTask) {
        this._state = 'disconnected'
        this.tryReconnect()
      }
      return false
    }

    if (!this.socketTask) {
      return false
    }

    this.socketTask.send({
      data: stringifyWsMessage(event_type, data),
      fail: (err) => this.handleSendFail(event_type, err, { quiet, reconnectOnFail }),
    })
    return true
  }

  private handleSendFail(eventType: WsEventType, err: unknown, options: SendOptions): void {
    if (!options.quiet) {
      console.error(`[WS] send ${eventType} failed:`, err)
    }
    if (this.intentionalClose || options.reconnectOnFail === false) return

    this.stopHeartbeat()
    this.closeSocketTask()
    this.socketTask = null
    this._state = 'disconnected'
    this.tryReconnect()
  }

  canSend(): boolean {
    return this._state === 'authenticated' && !!this.socketTask
  }

  tryReconnect(): void {
    if (this._state === 'connecting' || this._state === 'authenticated') return
    const { accessToken } = getStoredState()
    const token = accessToken
    if (!token) {
      console.warn('[WS] cannot reconnect: no token')
      return
    }
    this._state = 'disconnected'
    this.reconnectAttempts = 0
    this.reconnectStoppedUntil = 0
    this.scheduleReconnect(token)
  }

  disconnect(options: DisconnectOptions = {}): void {
    this.intentionalClose = true
    const data: WsDisconnectData = {
      reason: 'user_leaving',
      create_time: Math.floor(Date.now() / 1000),
    }
    this.send('disconnect', data, { requireAuth: false, quiet: true, reconnectOnFail: false })
    this.stopHeartbeat()
    this.clearReconnectTimer()
    this.closeSocketTask()
    this.socketTask = null
    this._state = 'disconnected'
    this.reconnectAttempts = 0
    this.authFailed = false
    this.reconnectStoppedUntil = 0
    if (options.clearToken) {
      this.token = ''
      this.authRecovering = false
      this.connectionId++
    }
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
        if (!this.connected && this.canReconnect()) {
          this.reconnectAttempts = 0
          this.reconnectStoppedUntil = 0
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
