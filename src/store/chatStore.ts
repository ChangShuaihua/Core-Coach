import Taro from '@tarojs/taro'
import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { ws } from '@/services/ws'
import { Conversation, Message, MessageStatus, Skill, SessionRuntime } from '@/types/chat'

// 技能持久化 key
const SKILL_STORAGE_KEY = 'chat_selected_skill'

// 发送超时（120 秒无响应标记为失败）
const SEND_TIMEOUT_MS = 120_000
const sendTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// abort 兜底定时器（按 requestId 管理，abort_result 返回时取消）
const abortFallbackTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function clearSendTimeout(sessionId: string) {
  const timer = sendTimeouts.get(sessionId)
  if (timer) {
    clearTimeout(timer)
    sendTimeouts.delete(sessionId)
  }
}

/** 清理 session 的 runtime 及其 requestToSession 映射 */
export function clearRuntime(sessionId: string) {
  useChatStore.setState((state) => {
    const runtime = state.sessionRuntimes[sessionId]
    const { [sessionId]: _, ...restRuntimes } = state.sessionRuntimes
    if (!runtime) return { sessionRuntimes: restRuntimes }
    const { [runtime.requestId]: __, ...restMapping } = state.requestToSession
    return { sessionRuntimes: restRuntimes, requestToSession: restMapping }
  })
}

/** 取消 abort 兜底定时器（abort_result 返回时调用） */
export function clearAbortFallbackTimer(requestId: string) {
  const timer = abortFallbackTimers.get(requestId)
  if (timer) {
    clearTimeout(timer)
    abortFallbackTimers.delete(requestId)
  }
}

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

/** 清除持久化的技能选择（退出登录时调用） */
export function clearSkillStorage() {
  persistSkill(null)
}

interface ChatStore {
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

  // WebSocket 相关
  wsConnected: boolean
  sessionRoles: Record<string, 'chatter' | 'viewer'>
  sessionRuntimes: Record<string, SessionRuntime>
  requestToSession: Record<string, string> // requestId -> sessionId 辅助索引
  lastStreamIds: Record<string, string>

  // ====== Actions ======

  loadConversations: () => Promise<void>
  ensurePendingConversation: () => void
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => void
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

  sendMessage: (content: string) => Promise<string | undefined>
  stopResponding: () => void

  loadWorkflows: () => Promise<void>
  toggleSkill: (skill: Skill) => void
  getCurrentWorkflowId: () => string

  setWsConnected: (connected: boolean) => void
  setSessionRole: (sessionId: string, role: 'chatter' | 'viewer') => void
  setLastStreamId: (sessionId: string, streamId: string) => void
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  // ====== State ======
  conversations: {},
  messagesBySession: {},
  currentConversationId: null,
  skills: [],
  defaultWorkflow: null,
  selectedSkill: loadPersistedSkill(),
  messageCursor: null,
  hasMoreMessages: true,
  isLoadingMore: false,
  wsConnected: false,
  sessionRoles: {},
  sessionRuntimes: {},
  requestToSession: {},
  lastStreamIds: {},

  // ====== 会话 Actions ======

  loadConversations: async () => {
    const result = await chatApi.getConversations()
    const { conversations, sessionRuntimes } = get()

    // 有 pending 会话正在等待 server 响应时，跳过添加新会话
    // 避免 server 返回的真实 session 与本地 pending 会话并存（产生重复）
    const hasPendingWithRuntime = Object.keys(conversations).some(
      (id) => id.startsWith('pending-') && sessionRuntimes[id]
    )

    const merged: Record<string, Conversation> = { ...conversations }
    result.conversations.forEach((conv) => {
      if (!merged[conv.id]) {
        if (hasPendingWithRuntime) return // 跳过添加新会话
        merged[conv.id] = conv
      } else {
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
    const { conversations, currentConversationId } = get()

    // 离开旧会话（pending 不用通知服务端）
    if (currentConversationId && !currentConversationId.startsWith('pending-')) {
      ws.send('session_leave', {
        session_id: currentConversationId,
        create_time: Math.floor(Date.now() / 1000),
      })
    }

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
    const { currentConversationId } = get()

    // 离开旧会话（pending 不用通知服务端）
    if (currentConversationId && !currentConversationId.startsWith('pending-')) {
      ws.send('session_leave', {
        session_id: currentConversationId,
        create_time: Math.floor(Date.now() / 1000),
      })
    }

    // 前端状态切换
    set({
      currentConversationId: id,
      messageCursor: null,
      hasMoreMessages: true,
      isLoadingMore: false,
    })

    // 进入新会话（pending 不用通知服务端）
    if (id.startsWith('pending-')) return

    ws.send('session_enter', {
      session_id: id,
      create_time: Math.floor(Date.now() / 1000),
    })

    // 加载消息（如果未缓存）
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

  updateConversation: (id: string, updates: Partial<Conversation>) => {
    set((state) => {
      const conv = state.conversations[id]
      if (!conv) return state
      return {
        conversations: { ...state.conversations, [id]: { ...conv, ...updates } },
      }
    })
  },

  // ====== 消息 Actions ======

  loadMessages: async (sessionId: string) => {
    if (sessionId.startsWith('pending-')) return
    if (get().sessionRuntimes[sessionId]) return

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

      const conv = state.conversations[sessionId]
      const updatedConv = conv
        ? {
            ...conv,
            title:
              conv.title === '新对话' && message.role === 'user'
                ? message.content.slice(0, 10) || '新对话'
                : conv.title,
            updatedAt: message.timestamp,
            messageCount: updatedMessages.length,
          }
        : undefined

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

  // ====== 发送消息（通过 WebSocket） ======

  sendMessage: async (content: string) => {
    const { currentConversationId, selectedSkill, defaultWorkflow, sessionRoles } = get()
    const currentWorkflow = selectedSkill || defaultWorkflow
    const workflowId = currentWorkflow?.id || ''
    const isNewConversation = !currentConversationId || currentConversationId.startsWith('pending-')

    if (currentConversationId && sessionRoles[currentConversationId] === 'viewer') {
      Taro.showToast({ title: '你当前是浏览模式，无法发送消息', icon: 'none' })
      return
    }

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

    const targetSessionId = currentConversationId || 'pending-' + Date.now()
    get().appendMessage(targetSessionId, userMsg)
    get().appendMessage(targetSessionId, aiMsg)

    const requestId = ws.generateRequestId()
    set((state) => ({
      sessionRuntimes: {
        ...state.sessionRuntimes,
        [targetSessionId]: { requestId, assistantMsgId: aiMsgId, status: 'pending' },
      },
      requestToSession: {
        ...state.requestToSession,
        [requestId]: targetSessionId,
      },
    }))

    // 检查连接状态
    if (!ws.canSend()) {
      ws.tryReconnect()
      Taro.showToast({ title: '连接断开，正在重连...', icon: 'none' })
      get().updateMessageStatus(targetSessionId, aiMsgId, 'error', '连接断开，请稍后重试')
      clearRuntime(targetSessionId)
      return
    }

    ws.send('chat', {
      output_type: currentWorkflow?.outputType === 0 ? 'sync' : 'stream',
      request_id: requestId,
      session_id: isNewConversation ? '' : currentConversationId!,
      content,
      workflow_id: workflowId,
      create_time: Math.floor(Date.now() / 1000),
    })

    // 启动发送超时定时器
    const timer = setTimeout(() => {
      sendTimeouts.delete(targetSessionId)
      const runtime = get().sessionRuntimes[targetSessionId]
      if (runtime && runtime.assistantMsgId === aiMsgId) {
        get().updateMessageStatus(targetSessionId, aiMsgId, 'error', '请求超时，请重试')
        clearRuntime(targetSessionId)
      }
    }, SEND_TIMEOUT_MS)
    sendTimeouts.set(targetSessionId, timer)

    return targetSessionId
  },

  // ====== 打断（通过 WebSocket） ======

  stopResponding: () => {
    const { currentConversationId, sessionRuntimes } = get()
    if (!currentConversationId) return

    const runtime = sessionRuntimes[currentConversationId]
    if (!runtime) return

    clearSendTimeout(currentConversationId)

    if (!ws.canSend()) {
      // 连接不可用，直接清理本地状态
      const messages = get().messagesBySession[currentConversationId] || []
      messages.forEach((m) => {
        if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
          get().updateMessageStatus(currentConversationId, m.id, 'error', '已停止生成')
        }
      })
      clearRuntime(currentConversationId)
      return
    }

    // 发送 abort，清理由 chatWsHandlers 的 abort_result 统一处理
    const requestId = runtime.requestId
    const isNewConversation = currentConversationId.startsWith('pending-')
    ws.send('abort', {
      request_id: requestId,
      session_id: isNewConversation ? '' : currentConversationId,
      reason: 'user_cancelled',
      create_time: Math.floor(Date.now() / 1000),
    })

    // 超时兜底：5 秒内服务端没有返回 abort_result，直接清理
    const timer = setTimeout(() => {
      abortFallbackTimers.delete(requestId)
      const currentRuntime = get().sessionRuntimes[currentConversationId]
      if (currentRuntime && currentRuntime.requestId === requestId) {
        const messages = get().messagesBySession[currentConversationId] || []
        messages.forEach((m) => {
          if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
            get().updateMessageStatus(currentConversationId, m.id, 'error', '已停止生成')
          }
        })
        clearRuntime(currentConversationId)
      }
    }, 5000)
    abortFallbackTimers.set(requestId, timer)
  },

  // ====== 技能 ======

  loadWorkflows: async () => {
    const all = await chatApi.getWorkflows()
    const basic = all.find((w) => w.type === 1) || null
    const skills = all.filter((w) => w.type === 2)

    // 校验持久化的 selectedSkill 是否还在当前工作流列表中
    const { selectedSkill } = get()
    if (selectedSkill && !all.some((w) => w.id === selectedSkill.id)) {
      persistSkill(null)
      set({ defaultWorkflow: basic, skills, selectedSkill: null })
    } else {
      set({ defaultWorkflow: basic, skills })
    }
  },

  toggleSkill: (skill: Skill) => {
    const { selectedSkill } = get()
    const next = selectedSkill?.id === skill.id ? null : skill
    persistSkill(next)
    set({ selectedSkill: next })
  },

  getCurrentWorkflowId: () => {
    const { selectedSkill, defaultWorkflow } = get()
    return selectedSkill?.id || defaultWorkflow?.id || ''
  },

  // ====== WebSocket 状态 ======

  setWsConnected: (connected: boolean) => set({ wsConnected: connected }),

  setSessionRole: (sessionId: string, role: 'chatter' | 'viewer') => {
    set((state) => ({
      sessionRoles: { ...state.sessionRoles, [sessionId]: role },
    }))
  },

  setLastStreamId: (sessionId: string, streamId: string) => {
    set((state) => ({
      lastStreamIds: { ...state.lastStreamIds, [sessionId]: streamId },
    }))
  },
}))

// ============ 注入 ws 重连上下文 getter ============

ws.setReconnectContextGetter(() => {
  const state = useChatStore.getState()
  const sessions = Object.entries(state.lastStreamIds).map(([sessionId, lastStreamId]) => ({
    sessionId,
    lastStreamId,
  }))
  return {
    currentSessionId: state.currentConversationId || '',
    sessions,
  }
})
