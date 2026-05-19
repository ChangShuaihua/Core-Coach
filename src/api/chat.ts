import { USE_MOCK } from '@/config/mock'
import { post, get } from '@/services/http'
import type { Conversation, Message, Skill } from '@/types/chat'

const mockDelay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

// ========== Mock 内存数据 ==========
let mockConversations: Conversation[] = []
let mockMessagesMap: Record<string, Message[]> = {}
let mockSkills: Skill[] = [
  {
    id: 'action-points',
    workflowId: 'wf-001',
    title: '动作要点解读',
    prompt: '请帮我解读这个动作的要点',
  },
  { id: 'course-qa', workflowId: 'wf-002', title: '课程问答', prompt: '我想了解课程相关的问题' },
  { id: 'action-level', workflowId: 'wf-003', title: '动作升降级', prompt: '如何进行动作升降级？' },
]

// ========== 会话 ==========

export async function getConversations(): Promise<Conversation[]> {
  if (USE_MOCK) {
    await mockDelay()
    return mockConversations.slice().sort((a, b) => b.updatedAt - a.updatedAt)
  }
  return get<Conversation[]>('/v1/app/conversations')
}

export async function createConversation(title?: string): Promise<Conversation> {
  if (USE_MOCK) {
    await mockDelay()
    const conv: Conversation = {
      id: 'conv-' + Date.now(),
      title: title || '新对话',
      lastMessage: '',
      updatedAt: Date.now(),
      messageCount: 0,
    }
    mockConversations.unshift(conv)
    mockMessagesMap[conv.id] = []
    return conv
  }
  return post<Conversation>('/v1/app/conversations', { title })
}

// ========== 消息 ==========

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (USE_MOCK) {
    await mockDelay()
    return mockMessagesMap[conversationId] || []
  }
  return get<Message[]>(`/v1/app/conversations/${conversationId}/messages`)
}

export async function sendMessage(
  conversationId: string,
  content: string,
  workflowId?: string
): Promise<Message> {
  if (USE_MOCK) {
    await mockDelay(2000)
    const aiMessage: Message = {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: `这是 AI 的回复（mock），你发送的内容是："${content}"${workflowId ? `，工作流：${workflowId}` : ''}`,
      timestamp: Date.now(),
      status: 'success',
    }
    // 存入 mock 数据
    if (!mockMessagesMap[conversationId]) {
      mockMessagesMap[conversationId] = []
    }
    mockMessagesMap[conversationId].push(aiMessage)
    // 更新会话
    const conv = mockConversations.find((c) => c.id === conversationId)
    if (conv) {
      conv.lastMessage = aiMessage.content.slice(0, 30)
      conv.updatedAt = Date.now()
      conv.messageCount = mockMessagesMap[conversationId].length
    }
    return aiMessage
  }
  return post<Message>(`/v1/app/conversations/${conversationId}/messages`, {
    content,
    workflowId,
  })
}

// ========== 技能 ==========

export async function getSkills(): Promise<Skill[]> {
  if (USE_MOCK) {
    await mockDelay()
    return mockSkills
  }
  return get<Skill[]>('/v1/app/skills')
}

// ========== 辅助：同步用户消息到 mock 数据 ==========

export function addUserMessageToMock(conversationId: string, message: Message): void {
  if (!USE_MOCK) return
  if (!mockMessagesMap[conversationId]) {
    mockMessagesMap[conversationId] = []
  }
  mockMessagesMap[conversationId].push(message)
  const conv = mockConversations.find((c) => c.id === conversationId)
  if (conv) {
    conv.title = conv.title === '新对话' ? message.content.slice(0, 20) : conv.title
    conv.lastMessage = message.content.slice(0, 30)
    conv.updatedAt = Date.now()
    conv.messageCount = mockMessagesMap[conversationId].length
  }
}
