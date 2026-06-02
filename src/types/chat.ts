// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system'

// 消息状态
export type MessageStatus = 'pending' | 'streaming' | 'success' | 'error'

// 消息图片
export interface MessageImage {
  name: string
  url: string
}

// 消息接口
export interface Message {
  id: string
  role: MessageRole
  content: string
  images?: MessageImage[]
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

// 会话接口
export interface Conversation {
  id: string
  title: string
  updatedAt: number
  messageCount: number
  hasOtherDevice: boolean
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

// ============ ChatStore 接口 ============

export interface ChatStore {
  // ====== State ======

  conversations: Record<string, Conversation>
  messagesBySession: Record<string, Message[]>
  currentConversationId: string | null
  skills: Skill[]
  defaultWorkflow: Skill | null
  selectedSkill: Skill | null
  messageCursor: string | null
  hasMoreMessages: boolean
  isLoadingMore: boolean

  // 会话列表分页
  conversationCursor: string | null
  hasMoreConversations: boolean
  isLoadingMoreConversations: boolean

  // WebSocket 相关
  wsConnected: boolean
  sessionRoles: Record<string, 'chatter' | 'viewer'>
  sessionRuntimes: Record<string, SessionRuntime>
  requestToSession: Record<string, string> // requestId -> sessionId 辅助索引
  lastStreamIds: Record<string, string>

  // ====== Actions ======

  loadConversations: () => Promise<void>
  loadMoreConversations: () => Promise<void>
  ensurePendingConversation: () => void
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  addConversation: (conv: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void

  loadMessages: (sessionId: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  appendMessage: (sessionId: string, message: Message) => void
  updateMessageStatus: (
    sessionId: string,
    msgId: string,
    status: MessageStatus,
    content?: string
  ) => void
  updateMessageImages: (sessionId: string, msgId: string, images: MessageImage[]) => void

  sendMessage: (content: string) => Promise<string | undefined>
  stopResponding: () => void

  loadWorkflows: () => Promise<void>
  toggleSkill: (skill: Skill) => void
  getCurrentWorkflowId: () => string

  setWsConnected: (connected: boolean) => void
  setSessionRole: (sessionId: string, role: 'chatter' | 'viewer') => void
  setLastStreamId: (sessionId: string, streamId: string) => void
}
