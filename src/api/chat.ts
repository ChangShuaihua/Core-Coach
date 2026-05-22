import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import { USE_MOCK } from '@/config/mock'
import { get, post } from '@/services/http'
import type { Conversation, Message, Skill, MessagePageData } from '@/types/chat'

const MSG_MOCK = false

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

const BASE_URL = process.env.TARO_APP_API_URL || 'http://192.168.10.7:8083/api/v1'

// ========== 会话列表（支持游标分页） ==========

export async function getConversations(
  cursor?: string,
  limit = 20
): Promise<{ conversations: Conversation[]; nextCursor: string | null; hasMore: boolean }> {
  if (MSG_MOCK) {
    await mockDelay()
    return {
      conversations: mockConversations.slice().sort((a, b) => b.updatedAt - a.updatedAt),
      nextCursor: null,
      hasMore: false,
    }
  }

  const res = await get<{
    sessions: Array<{ session_id: string; title: string; last_message_at: string }>
    total: number
    next_cursor: string | null
  }>('/ai-qa/sessions', {
    limit,
    ...(cursor ? { cursor } : {}),
  })

  const data = res.data
  const conversations = data.sessions.map((s) => ({
    id: s.session_id,
    title: s.title,
    updatedAt: dayjs(s.last_message_at).valueOf(),
    messageCount: 0,
  }))

  return {
    conversations,
    nextCursor: data.next_cursor,
    hasMore: !!data.next_cursor,
  }
}

// ========== 消息历史（支持游标分页） ==========

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit = 20
): Promise<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }> {
  if (MSG_MOCK) {
    await mockDelay()
    return {
      messages: mockMessagesMap[conversationId] || [],
      nextCursor: null,
      hasMore: false,
    }
  }

  const res = await post<MessagePageData>('/ai-qa/history/detail', {
    session_id: conversationId,
    limit,
    ...(cursor ? { cursor } : {}),
  })

  const data = res.data
  const messages: Message[] = (data.chat_messages || []).map((m) => ({
    id: String(m.id),
    role: m.role,
    content: m.content,
    timestamp: dayjs(m.created_at).valueOf(),
    status: 'success' as const,
  }))

  return {
    messages,
    nextCursor: data.next_cursor,
    hasMore: data.has_more,
  }
}

// ========== 发送消息 / 创建会话 ==========

interface SendMessageResult {
  sessionId: string
  content: string
}

/**
 * 发送消息（同时支持创建新会话）
 * - 不传 sessionId → 创建新会话并发送消息
 * - 传 sessionId → 在已有会话中发送消息
 * 返回 { request, promise }，request 可用于 abort 打断
 */
export function sendMessage(
  content: string,
  workflowId: string,
  sessionId?: string
): { request: Taro.RequestTask<any>; promise: Promise<SendMessageResult> } {
  if (MSG_MOCK) {
    const mockResult: SendMessageResult = {
      sessionId: sessionId || 'mock-' + Date.now(),
      content: `这是 AI 的回复（mock），你发送的内容是："${content}"`,
    }
    const abortController = { aborted: false }
    return {
      request: {
        abort: () => {
          abortController.aborted = true
        },
      } as any,
      promise: mockDelay(2000).then(() => mockResult),
    }
  }

  const body: Record<string, any> = {
    content,
    workflow_id: workflowId,
  }
  if (sessionId) {
    body.session_id = sessionId
  }

  const token = Taro.getStorageSync('accessToken') || ''

  const requestTask = Taro.request({
    url: `${BASE_URL}/ai-qa/reply/workflow`,
    method: 'POST',
    data: body,
    header: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: 100000,
  })

  const promise = new Promise<SendMessageResult>((resolve, reject) => {
    requestTask
      .then((res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = res.data?.data || res.data
          resolve({
            sessionId: String(data.session_id),
            content: data.content,
          })
        } else {
          reject(new Error(res.data?.message || '请求失败'))
        }
      })
      .catch((err) => {
        reject(err)
      })
  })

  return { request: requestTask, promise }
}

// ========== 技能 ==========

export async function getSkills(): Promise<Skill[]> {
  if (!USE_MOCK) {
    await mockDelay()
    return mockSkills
  }
  const res = await get<Skill[]>('/v1/app/skills')
  return res.data
}

// ========== 辅助：同步用户消息到 mock 数据 ==========

export function addUserMessageToMock(conversationId: string, message: Message): void {
  if (!MSG_MOCK) return
  if (!mockMessagesMap[conversationId]) {
    mockMessagesMap[conversationId] = []
  }
  mockMessagesMap[conversationId].push(message)
  const conv = mockConversations.find((c) => c.id === conversationId)
  if (conv) {
    conv.title = conv.title === '新对话' ? message.content.slice(0, 20) : conv.title
    conv.updatedAt = Date.now()
    conv.messageCount = mockMessagesMap[conversationId].length
  }
}
