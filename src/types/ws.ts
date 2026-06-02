// ============ 事件类型枚举 ============

export type WsEventType =
  | 'auth'
  | 'connected'
  | 'auth_failed'
  | 'ping'
  | 'pong'
  | 'chat'
  | 'chat_session_created'
  | 'reply'
  | 'stream_chunk'
  | 'stream_done'
  | 'error'
  | 'session_enter'
  | 'session_leave'
  | 'session_enter_result'
  | 'session_role_change'
  | 'session_switch'
  | 'session_released'
  | 'abort'
  | 'abort_result'
  | 'reconnect'
  | 'reconnect_result'
  | 'disconnect'
  | 'game_generate_status'

// ============ 连接状态 ============

export type WsConnectionState = 'disconnected' | 'connecting' | 'connected' | 'authenticated'

// ============ 通用消息包装 ============

export interface WsMessage<T = any> {
  event_type: WsEventType
  data: T
}

// ============ 客户端 → 服务端 ============

export interface WsAuthData {
  token: string
}

export interface WsChatData {
  output_type: 'stream' | 'sync'
  request_id: string
  session_id: string
  content: string
  workflow_id?: string
  image_need?: number
  create_time: number
}

export interface WsAbortData {
  request_id: string
  session_id: string
  reason: 'user_cancelled'
  create_time: number
}

export interface WsReconnectSession {
  session_id: string
  last_stream_id: string
}

export interface WsReconnectData {
  token: string
  sessions: WsReconnectSession[]
}

export interface WsDisconnectData {
  reason: string
  create_time: number
}

export interface WsPingData {
  timestamp: number
}

export interface WsSessionEnterData {
  session_id: string
  create_time: number
}

export interface WsSessionLeaveData {
  session_id: string
  create_time: number
}

// ============ 服务端 → 客户端 ============

export interface WsChatSessionCreatedData {
  session_id: string
  title: string
  request_id: string
  create_time: number
}

export interface WsConnectedData {
  content: 'success'
}

export interface WsAuthFailedData {
  code: number
  message: string
  retry_after?: number
}

export interface WsPongData {
  timestamp: number
  server_time: number
  connection_status: 'active'
}

export interface WsReplyData {
  output_type: 'sync'
  request_id: string
  session_id: string
  content: string
  images?: Array<{ name: string; url: string }>
  create_time: number
  finished: boolean
}

export interface WsStreamChunkData {
  output_type: 'stream'
  request_id: string
  session_id: string
  stream_id: string
  chunk_index: number
  content: string
  create_time: number
  finished: false
}

export interface WsStreamDoneData {
  output_type: 'stream'
  request_id: string
  session_id: string
  total_chunks: number
  content: string
  images?: Array<{ name: string; url: string }>
  create_time: number
  finished: true
}

export interface WsErrorData {
  code: string
  http_code?: number
  message: string
  request_id?: string
  session_id?: string
  recoverable: boolean
  suggested_action?: string
  create_time: number
}

export interface WsAbortResultData {
  request_id: string
  session_id: string
  success: boolean
  stopped_at_chunk: number
  message: string
  create_time: number
}

export interface WsMissedMessage {
  event_type: WsEventType
  request_id: string
  data: any
}

export interface WsReconnectResultData {
  session_id: string
  success: boolean
  has_active_stream: boolean
  missed_messages: WsMissedMessage[]
  create_time: number
}

export interface WsSessionReleasedData {
  session_id: string
  message: string
  create_time: number
}

export interface WsSessionEnterResultData {
  session_id: string
  role: 'chatter' | 'viewer'
  create_time: number
}

export interface WsSessionRoleChangeData {
  session_id: string
  new_role: 'chatter' | 'viewer'
  create_time: number
}

// ============ 游戏生成状态推送 ============

export interface WsGameGenerateResult {
  game_name: string
  generated_content: string
  music?: string
  music_storage_status?: string
}

export interface WsGameGenerateStatusData {
  record_id: number
  status: 'queued' | 'generating' | 'success' | 'failed'
  message: string
  create_time: number
  estimated_seconds?: number
  result?: WsGameGenerateResult
  error?: string
}

// ============ 错误码常量 ============

export const WS_ERROR_CODES = {
  SESSION_OCCUPIED: 'WS_ERR_SESSION_OCCUPIED',
  COZE_TIMEOUT: 'WS_ERR_COZE_TIMEOUT',
  COZE_AUTH: 'WS_ERR_COZE_AUTH',
  COZE_INTERNAL: 'WS_ERR_COZE_INTERNAL',
  STREAM_EXPIRED: 'WS_ERR_STREAM_EXPIRED',
} as const
