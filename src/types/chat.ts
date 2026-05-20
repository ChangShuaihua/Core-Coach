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

// 技能/工作流
export interface Skill {
  id: string
  workflowId: string
  title: string
  prompt: string
  description?: string
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
  created_at: string
}

// 消息分页响应
export interface MessagePageData {
  chat_messages: ApiMessage[]
  next_cursor: string | null
  has_more: boolean
}
