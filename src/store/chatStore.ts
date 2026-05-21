import Taro from '@tarojs/taro'
import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { Conversation, Message, MessageStatus, Skill } from '@/types/chat'

// 基础工作流 ID，不选技能时使用
const DEFAULT_WORKFLOW_ID = '7639722909792419886'

// localStorage 持久化 key
const SKILL_STORAGE_KEY = 'chat_selected_skill'

function loadPersistedSkill(): Skill | null {
  try {
    const raw = Taro.getStorageSync(SKILL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistSkill(skill: Skill | null) {
  try {
    if (skill) {
      Taro.setStorageSync(SKILL_STORAGE_KEY, JSON.stringify(skill))
    } else {
      Taro.removeStorageSync(SKILL_STORAGE_KEY)
    }
  } catch {}
}

interface ChatStore {
  conversations: Conversation[]
  currentConversationId: string | null
  currentMessages: Message[]
  skills: Skill[]
  selectedSkill: Skill | null

  // 消息分页状态
  messageCursor: string | null
  hasMoreMessages: boolean
  isLoadingMore: boolean

  // 当前请求任务（用于 abort 打断）
  currentRequest: Taro.RequestTask<any> | null

  // 会话
  loadConversations: () => Promise<void>
  ensurePendingConversation: () => void
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>

  // 消息
  loadMessages: (conversationId: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  appendMessage: (message: Message) => void
  updateMessageStatus: (id: string, status: MessageStatus, content?: string) => void

  // 发送消息（同时支持创建新会话）
  sendMessage: (content: string) => Promise<string | undefined>

  // 打断当前 AI 回复
  stopResponding: () => void

  // 技能
  loadSkills: () => Promise<void>
  toggleSkill: (skill: Skill) => void
  getCurrentWorkflowId: () => string
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  currentMessages: [],
  skills: [],
  selectedSkill: loadPersistedSkill(),

  // 消息分页状态
  messageCursor: null,
  hasMoreMessages: true,
  isLoadingMore: false,

  // 当前请求任务
  currentRequest: null,

  // ========== 会话 ==========

  loadConversations: async () => {
    const result = await chatApi.getConversations()
    const { conversations } = get()
    // 保留本地的临时会话，不被 API 返回的数据覆盖
    const pendingConvs = conversations.filter((c) => c.id.startsWith('pending-'))
    set({ conversations: [...pendingConvs, ...result.conversations] })
  },

  // 确保至少有一个临时会话（初始进入时调用）
  ensurePendingConversation: () => {
    const { conversations } = get()
    const hasPending = conversations.some((c) => c.id.startsWith('pending-'))
    if (hasPending) {
      // 已有临时会话，切换到它
      const pending = conversations.find((c) => c.id.startsWith('pending-'))!
      set({ currentConversationId: pending.id, currentMessages: [] })
    } else {
      // 没有临时会话，创建一个
      const tempId = 'pending-' + Date.now()
      const tempConv: Conversation = {
        id: tempId,
        title: '新对话',
        updatedAt: Date.now(),
        messageCount: 0,
      }
      set((state) => ({
        currentConversationId: tempId,
        currentMessages: [],
        conversations: [tempConv, ...state.conversations],
      }))
    }
  },

  switchConversation: async (id: string) => {
    set({
      currentConversationId: id,
      currentMessages: [],
      messageCursor: null,
      hasMoreMessages: true,
      isLoadingMore: false,
    })
    // 临时会话没有真实数据，跳过请求
    if (id.startsWith('pending-')) return

    const result = await chatApi.getMessages(id)
    if (get().currentConversationId === id) {
      set({
        currentMessages: result.messages,
        messageCursor: result.nextCursor,
        hasMoreMessages: result.hasMore,
      })
    }
  },

  deleteConversation: async (id: string) => {
    set((state) => {
      const newConversations = state.conversations.filter((c) => c.id !== id)
      let newCurrentId = state.currentConversationId
      if (state.currentConversationId === id) {
        newCurrentId = newConversations[0]?.id || null
      }
      return {
        conversations: newConversations,
        currentConversationId: newCurrentId,
        currentMessages: [],
      }
    })
  },

  // ========== 消息 ==========

  loadMessages: async (conversationId: string) => {
    // 临时会话没有真实数据，跳过请求
    if (conversationId.startsWith('pending-')) return

    const result = await chatApi.getMessages(conversationId)
    if (get().currentConversationId === conversationId) {
      set({
        currentMessages: result.messages,
        messageCursor: result.nextCursor,
        hasMoreMessages: result.hasMore,
      })
    }
  },

  loadMoreMessages: async () => {
    const { currentConversationId, messageCursor, hasMoreMessages, isLoadingMore } = get()
    if (!currentConversationId || !hasMoreMessages || isLoadingMore || !messageCursor) return
    // 临时会话没有真实数据，跳过请求
    if (currentConversationId.startsWith('pending-')) return

    set({ isLoadingMore: true })
    try {
      const result = await chatApi.getMessages(currentConversationId, messageCursor)
      if (get().currentConversationId === currentConversationId) {
        set((state) => ({
          currentMessages: [...result.messages, ...state.currentMessages],
          messageCursor: result.nextCursor,
          hasMoreMessages: result.hasMore,
        }))
      }
    } finally {
      set({ isLoadingMore: false })
    }
  },

  appendMessage: (message: Message) => {
    const { currentConversationId } = get()
    if (!currentConversationId) return

    set((state) => {
      const updatedMessages = [...state.currentMessages, message]
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id !== currentConversationId) return conv
        return {
          ...conv,
          title:
            conv.title === '新对话' && message.role === 'user'
              ? message.content.slice(0, 20) || '新对话'
              : conv.title,
          updatedAt: message.timestamp,
          messageCount: updatedMessages.length,
        }
      })
      const currentConv = updatedConversations.find((c) => c.id === currentConversationId)
      const others = updatedConversations.filter((c) => c.id !== currentConversationId)
      const sorted = currentConv ? [currentConv, ...others] : updatedConversations

      return {
        currentMessages: updatedMessages,
        conversations: sorted,
      }
    })
  },

  updateMessageStatus: (id: string, status: MessageStatus, content?: string) => {
    set((state) => ({
      currentMessages: state.currentMessages.map((m) =>
        m.id === id ? { ...m, status, ...(content !== undefined ? { content } : {}) } : m
      ),
    }))
  },

  // ========== 发送消息（同时支持创建新会话） ==========

  sendMessage: async (content: string) => {
    const { currentConversationId, selectedSkill } = get()
    const workflowId = selectedSkill?.workflowId || DEFAULT_WORKFLOW_ID

    // 判断是否是新建会话（没有会话 ID 或是临时 ID）
    const isNewConversation = !currentConversationId || currentConversationId.startsWith('pending-')

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'success',
    }
    const aiMsgId = 'a-' + Date.now()
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'pending',
    }

    if (currentConversationId) {
      get().appendMessage(userMsg)
      get().appendMessage(aiMsg)
    } else {
      set({ currentMessages: [userMsg, aiMsg] })
    }

    // 新建会话不传 sessionId，已有会话传真实 sessionId
    const sessionId = isNewConversation ? undefined : currentConversationId
    const { request, promise } = chatApi.sendMessage(content, workflowId, sessionId)

    set({ currentRequest: request })

    try {
      const result = await promise
      const newSessionId = result.sessionId

      if (isNewConversation) {
        // 把临时会话替换为真实会话
        set((state) => ({
          currentConversationId: newSessionId,
          conversations: state.conversations.map((c) =>
            c.id === currentConversationId
              ? { ...c, id: newSessionId, title: content.slice(0, 20) || '新对话' }
              : c
          ),
        }))
      }

      get().updateMessageStatus(aiMsgId, 'success', result.content)
      return newSessionId
    } catch (err: any) {
      if (err?.errMsg?.includes('abort') || err?.message?.includes('abort')) {
        return
      }
      get().updateMessageStatus(aiMsgId, 'error', '发送失败')
    } finally {
      set({ currentRequest: null })
    }
  },

  // ========== 打断当前 AI 回复 ==========

  stopResponding: () => {
    const { currentRequest, currentMessages } = get()
    if (currentRequest) {
      currentRequest.abort()
    }
    // 将所有 pending 状态的消息标记为已停止
    currentMessages.forEach((m) => {
      if (m.role === 'assistant' && m.status === 'pending') {
        get().updateMessageStatus(m.id, 'error', '已停止生成')
      }
    })
  },

  // ========== 技能 ==========

  loadSkills: async () => {
    const skills = await chatApi.getSkills()
    set({ skills })
  },

  toggleSkill: (skill: Skill) => {
    const { selectedSkill } = get()
    const next = selectedSkill?.id === skill.id ? null : skill
    persistSkill(next)
    set({ selectedSkill: next })
  },

  getCurrentWorkflowId: () => {
    const { selectedSkill } = get()
    return selectedSkill?.workflowId || DEFAULT_WORKFLOW_ID
  },
}))
