import type { WsEventType } from '@/types/ws'

export type WsEventHandler = (data: any) => void

export interface DisconnectOptions {
  clearToken?: boolean
}

export interface SendOptions {
  requireAuth?: boolean
  quiet?: boolean
  reconnectOnFail?: boolean
}

export interface ReconnectSession {
  sessionId: string
  lastStreamId: string
}

export interface ReconnectContext {
  currentSessionId: string
  sessions: ReconnectSession[]
}

export type WsHandlerMap = Map<WsEventType, Set<WsEventHandler>>
