import dayjs from 'dayjs'
import { get, post } from '@/services/http'
import type { Conversation, Message, Skill, MessagePageData } from '@/types/chat'

// ========== 会话列表（支持游标分页） ==========

export async function getConversations(
  cursor?: string,
  limit = 20
): Promise<{ conversations: Conversation[]; nextCursor: string | null; hasMore: boolean }> {
  const res = await get<{
    sessions: Array<{ session_id: string; title: string; last_message_at: string }>
    total: number
    next_cursor: string | null
  }>('/app/ai-qa/sessions', {
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
  const res = await post<MessagePageData>('/app/ai-qa/history/detail', {
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

/** 接口返回的原始工作流结构 */
interface WorkflowItem {
  flow_id: string
  description: string
  image_need: number
  type: number
  output_type: number
}

export async function getWorkflows(): Promise<Skill[]> {
  const res = await get<WorkflowItem[]>('/app/ai-qa/workflows')
  return (res.data || []).map((item) => ({
    id: item.flow_id,
    title: item.description,
    imageNeed: item.image_need,
    type: item.type,
    outputType: item.output_type,
  }))
}
