import Taro from '@tarojs/taro'
import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { Conversation, Message, MessageStatus, Skill } from '@/types/chat'

// 基础工作流 ID，不选技能时使用
const DEFAULT_WORKFLOW_ID = '7639722909792419886'

// 技能持久化 key
const SKILL_STORAGE_KEY = 'chat_selected_skill'

function loadPersistedSkill(): Skill | null {
  try {
    const raw = Taro.getStorageSync(SKILL_STORAGE_KEY)
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
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
  // ====== State ======

  // 会话表（扁平化，Record<id, Conversation>）
  conversations: Record<string, Conversation>

  // 消息表（按会话分组，Record<sessionId, Message[]>）
  messagesBySession: Record<string, Message[]>

  // 当前选中的会话 ID
  currentConversationId: string | null

  // 技能列表
  skills: Skill[]

  // 选中的技能（持久化）
  selectedSkill: Skill | null

  // 消息分页状态
  messageCursor: string | null
  hasMoreMessages: boolean
  isLoadingMore: boolean

  // 进行中的流式消息（支持多条并发）
  streamingMessages: Record<string, { sessionId: string; content: string }>

  // 当前请求任务（用于 abort 打断）
  currentRequest: Taro.RequestTask<any> | null

  // ====== Actions ======

  // 会话
  loadConversations: () => Promise<void>
  ensurePendingConversation: () => void
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => void
  addConversation: (conv: Conversation) => void

  // 消息
  loadMessages: (sessionId: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  appendMessage: (sessionId: string, message: Message) => void
  updateMessageStatus: (
    sessionId: string,
    msgId: string,
    status: MessageStatus,
    content?: string
  ) => void

  // 发送消息
  sendMessage: (content: string) => Promise<string | undefined>

  // 打断
  stopResponding: () => void

  // 技能
  loadSkills: () => Promise<void>
  toggleSkill: (skill: Skill) => void
  getCurrentWorkflowId: () => string
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  // ====== State ======
  conversations: {},
  messagesBySession: {},
  currentConversationId: null,
  skills: [],
  selectedSkill: loadPersistedSkill(),
  messageCursor: null,
  hasMoreMessages: true,
  isLoadingMore: false,
  streamingMessages: {},
  currentRequest: null,

  // ====== 会话 Actions ======

  loadConversations: async () => {
    const result = await chatApi.getConversations()
    const { conversations } = get()

    // 合并：保留本地临时会话，更新远程会话
    const merged: Record<string, Conversation> = { ...conversations }
    result.conversations.forEach((conv) => {
      if (!merged[conv.id]) {
        merged[conv.id] = conv
      } else {
        // 更新已有会话的元数据
        merged[conv.id] = {
          ...merged[conv.id],
          title: conv.title,
          updatedAt: conv.updatedAt,
        }
      }
    })

    set({ conversations: merged })
  },

  ensurePendingConversation: () => {
    const { conversations } = get()
    const pending = Object.values(conversations).find((c) => c.id.startsWith('pending-'))

    if (pending) {
      set({ currentConversationId: pending.id })
    } else {
      const tempId = 'pending-' + Date.now()
      const tempConv: Conversation = {
        id: tempId,
        title: '新对话',
        updatedAt: Date.now(),
        messageCount: 0,
      }
      set((state) => ({
        currentConversationId: tempId,
        conversations: { ...state.conversations, [tempId]: tempConv },
      }))
    }
  },

  switchConversation: async (id: string) => {
    set({
      currentConversationId: id,
      messageCursor: null,
      hasMoreMessages: true,
      isLoadingMore: false,
    })

    // 临时会话跳过请求
    if (id.startsWith('pending-')) return

    // 如果已有缓存消息，不重新加载
    const { messagesBySession } = get()
    if (messagesBySession[id]) return

    const result = await chatApi.getMessages(id)
    if (get().currentConversationId === id) {
      set((state) => ({
        messagesBySession: { ...state.messagesBySession, [id]: result.messages },
        messageCursor: result.nextCursor,
        hasMoreMessages: result.hasMore,
      }))
    }
  },

  deleteConversation: (id: string) => {
    set((state) => {
      const { [id]: _, ...restConvs } = state.conversations
      const { [id]: __, ...restMsgs } = state.messagesBySession

      let newCurrentId = state.currentConversationId
      if (state.currentConversationId === id) {
        const firstId = Object.keys(restConvs)[0] || null
        newCurrentId = firstId
      }

      return {
        conversations: restConvs,
        messagesBySession: restMsgs,
        currentConversationId: newCurrentId,
      }
    })
  },

  addConversation: (conv: Conversation) => {
    set((state) => ({
      conversations: { ...state.conversations, [conv.id]: conv },
    }))
  },

  // ====== 消息 Actions ======

  loadMessages: async (sessionId: string) => {
    if (sessionId.startsWith('pending-')) return

    const result = await chatApi.getMessages(sessionId)
    if (get().currentConversationId === sessionId) {
      set((state) => ({
        messagesBySession: { ...state.messagesBySession, [sessionId]: result.messages },
        messageCursor: result.nextCursor,
        hasMoreMessages: result.hasMore,
      }))
    }
  },

  loadMoreMessages: async () => {
    const { currentConversationId, messageCursor, hasMoreMessages, isLoadingMore } = get()
    if (!currentConversationId || !hasMoreMessages || isLoadingMore || !messageCursor) return
    if (currentConversationId.startsWith('pending-')) return

    set({ isLoadingMore: true })
    try {
      const result = await chatApi.getMessages(currentConversationId, messageCursor)
      if (get().currentConversationId === currentConversationId) {
        set((state) => ({
          messagesBySession: {
            ...state.messagesBySession,
            [currentConversationId]: [
              ...result.messages,
              ...(state.messagesBySession[currentConversationId] || []),
            ],
          },
          messageCursor: result.nextCursor,
          hasMoreMessages: result.hasMore,
        }))
      }
    } finally {
      set({ isLoadingMore: false })
    }
  },

  appendMessage: (sessionId: string, message: Message) => {
    set((state) => {
      const messages = state.messagesBySession[sessionId] || []
      const updatedMessages = [...messages, message]

      // 更新会话元数据
      const conv = state.conversations[sessionId]
      const updatedConv = conv
        ? {
            ...conv,
            title:
              conv.title === '新对话' && message.role === 'user'
                ? message.content.slice(0, 20) || '新对话'
                : conv.title,
            updatedAt: message.timestamp,
            messageCount: updatedMessages.length,
          }
        : undefined

      // 当前置顶当前会话
      if (updatedConv) {
        const { [sessionId]: _, ...rest } = state.conversations
        return {
          messagesBySession: { ...state.messagesBySession, [sessionId]: updatedMessages },
          conversations: { [sessionId]: updatedConv, ...rest },
        }
      }

      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updatedMessages },
      }
    })
  },

  updateMessageStatus: (
    sessionId: string,
    msgId: string,
    status: MessageStatus,
    content?: string
  ) => {
    set((state) => {
      const messages = state.messagesBySession[sessionId] || []
      const updated = messages.map((m) =>
        m.id === msgId ? { ...m, status, ...(content !== undefined ? { content } : {}) } : m
      )
      return { messagesBySession: { ...state.messagesBySession, [sessionId]: updated } }
    })
  },

  // ====== 发送消息 ======

  sendMessage: async (content: string) => {
    const { currentConversationId, selectedSkill } = get()
    const workflowId = selectedSkill?.workflowId || DEFAULT_WORKFLOW_ID
    const isNewConversation = !currentConversationId || currentConversationId.startsWith('pending-')

    // 创建消息
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

    // 乐观更新
    const targetSessionId = currentConversationId || 'pending-' + Date.now()
    get().appendMessage(targetSessionId, userMsg)
    get().appendMessage(targetSessionId, aiMsg)

    // 调用 API
    const sessionId = isNewConversation ? undefined : currentConversationId
    const { request, promise } = chatApi.sendMessage(content, workflowId, sessionId)

    set({ currentRequest: request })

    try {
      const result = await promise
      const newSessionId = result.sessionId

      // 新会话：替换临时 ID
      if (isNewConversation && currentConversationId?.startsWith('pending-')) {
        set((state) => {
          const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
          const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession

          const newConv: Conversation = {
            ...(pendingConv as Conversation),
            id: newSessionId,
            title: content.slice(0, 20) || '新对话',
          }

          return {
            currentConversationId: newSessionId,
            conversations: { [newSessionId]: newConv, ...restConvs },
            messagesBySession: { [newSessionId]: pendingMsgs || [], ...restMsgs },
          }
        })
      }

      // 更新 AI 消息
      const finalSessionId = isNewConversation ? newSessionId : currentConversationId!
      get().updateMessageStatus(finalSessionId, aiMsgId, 'success', result.content)

      return newSessionId
    } catch (err: any) {
      if (err?.errMsg?.includes('abort') || err?.message?.includes('abort')) return
      const finalSessionId = isNewConversation ? targetSessionId : currentConversationId!
      get().updateMessageStatus(finalSessionId, aiMsgId, 'error', '发送失败')
    } finally {
      set({ currentRequest: null })
    }
  },

  // ====== 打断 ======

  stopResponding: () => {
    const { currentConversationId, messagesBySession, currentRequest } = get()
    if (currentRequest) {
      currentRequest.abort()
    }
    if (!currentConversationId) return

    const messages = messagesBySession[currentConversationId] || []
    messages.forEach((m) => {
      if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
        get().updateMessageStatus(currentConversationId, m.id, 'error', '已停止生成')
      }
    })
  },

  // ====== 技能 ======

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
