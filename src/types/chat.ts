// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system'

// 消息状态
export type MessageStatus = 'pending' | 'streaming' | 'success' | 'error'

// 消息接口
export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  status: MessageStatus
}

// 技能/工作流（对应 /ai-qa/workflows 接口）
export interface Skill {
  id: string // = flow_id，唯一标识
  title: string // = description，显示名称
  imageNeed: number // 是否需要图片 0否 1是
  type: number // 1基础问答 2技能
  outputType: number // 0非流式 1流式
}

// 单个 session 的实时流运行状态
export interface SessionRuntime {
  requestId: string // 当前活跃的 request_id
  assistantMsgId: string // 对应的 assistant 消息 ID
  status: 'pending' | 'streaming' | 'done'
}

// 快捷操作接口（deprecated，后续统一用 Skill）
export interface QuickAction {
  id: string
  title: string
  prompt: string
}

// 会话接口
export interface Conversation {
  id: string
  title: string
  updatedAt: number
  messageCount: number
}

// API 返回的原始消息格式
export interface ApiMessage {
  id: number
  session_id: number
  user_id: number
  role: 'user' | 'assistant'
  content: string
  result?: 'success' | 'failure'
  created_at: string
}

// 消息分页响应
export interface MessagePageData {
  chat_messages: ApiMessage[]
  next_cursor: string | null
  has_more: boolean
}
