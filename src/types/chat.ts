// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system'

// 消息接口
export interface Message {
  id: string // 消息唯一ID
  role: MessageRole // 消息角色（用户/AI/系统）
  content: string // 消息内容
  timestamp: number // 时间戳
  isStreaming?: boolean // 是否正在流式输出（可选）
}

// 快捷操作接口
export interface QuickAction {
  id: string // 快捷操作ID
  title: string // 显示标题
  prompt: string // 点击后填充到输入框的文本
}

// 对话状态接口
export interface ChatState {
  messages: Message[] // 消息列表
  isLoading: boolean // 是否正在加载
  error: string | null // 错误信息
}

// 会话接口
export interface Conversation {
  id: string // 会话唯一ID
  title: string // 会话标题（取第一条用户消息）
  lastMessage: string // 最后一条消息预览
  updatedAt: number // 最后更新时间戳
  messageCount: number // 消息数量
}
