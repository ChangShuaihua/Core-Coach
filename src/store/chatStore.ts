import Taro from '@tarojs/taro'
import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { ws } from '@/services/ws'
import { Conversation, Message, MessageStatus, Skill, SessionRuntime } from '@/types/chat'
import type {
  WsStreamChunkData,
  WsStreamDoneData,
  WsReplyData,
  WsErrorData,
  WsAbortResultData,
  WsSessionReleasedData,
} from '@/types/ws'
import { WS_ERROR_CODES } from '@/types/ws'

// 技能持久化 key
const SKILL_STORAGE_KEY = 'chat_selected_skill'

// 发送超时（30 秒无响应标记为失败）
const SEND_TIMEOUT_MS = 30_000
const sendTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// 按 request_id 在所有 runtime 中查找，返回 sessionId
function findSessionByRequestId(
  runtimes: Record<string, SessionRuntime>,
  requestId: string
): string | undefined {
  return Object.entries(runtimes).find(([, rt]) => rt.requestId === requestId)?.[0]
}

// 清除发送超时定时器
function clearSendTimeout(sessionId: string) {
  const timer = sendTimeouts.get(sessionId)
  if (timer) {
    clearTimeout(timer)
    sendTimeouts.delete(sessionId)
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
  sessionOccupied: Record<string, boolean>
  sessionRuntimes: Record<string, SessionRuntime>

  // ====== Actions ======

  loadConversations: () => Promise<void>
  ensurePendingConversation: () => void
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => void
  addConversation: (conv: Conversation) => void

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
  setSessionOccupied: (sessionId: string, occupied: boolean) => void

  initWsHandlers: () => void
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
  sessionOccupied: {},
  sessionRuntimes: {},

  // ====== 会话 Actions ======

  loadConversations: async () => {
    const result = await chatApi.getConversations()
    const { conversations } = get()

    const merged: Record<string, Conversation> = { ...conversations }
    result.conversations.forEach((conv) => {
      if (!merged[conv.id]) {
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
    ws.setCurrentSession(id)

    set({
      currentConversationId: id,
      messageCursor: null,
      hasMoreMessages: true,
      isLoadingMore: false,
    })

    if (id.startsWith('pending-')) return

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
    // 如果该 session 有正在生成的消息，跳过拉取，避免覆盖本地 streaming 状态
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
                ? message.content.slice(0, 20) || '新对话'
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
    const { currentConversationId, selectedSkill, defaultWorkflow, sessionOccupied } = get()
    const currentWorkflow = selectedSkill || defaultWorkflow
    const workflowId = currentWorkflow?.id || ''
    const isNewConversation = !currentConversationId || currentConversationId.startsWith('pending-')

    // 检查会话是否被占用
    if (currentConversationId && sessionOccupied[currentConversationId]) {
      Taro.showToast({ title: '该会话正在其他设备使用中', icon: 'none' })
      return
    }

    // 创建乐观消息
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

    // 通过 WebSocket 发送
    const requestId = ws.generateRequestId()
    console.log(
      '[sendMessage] storing runtime for session:',
      targetSessionId,
      'requestId:',
      requestId
    )
    set((state) => ({
      sessionRuntimes: {
        ...state.sessionRuntimes,
        [targetSessionId]: { requestId, assistantMsgId: aiMsgId, status: 'pending' },
      },
    }))

    const sent = ws.sendChat({
      output_type: currentWorkflow?.outputType === 0 ? 'sync' : 'stream',
      request_id: requestId,
      session_id: isNewConversation ? '' : currentConversationId!,
      content,
      workflow_id: workflowId,
      create_time: Math.floor(Date.now() / 1000),
    })

    if (!sent) {
      Taro.showToast({ title: '连接断开，正在重连...', icon: 'none' })
      get().updateMessageStatus(targetSessionId, aiMsgId, 'error', '连接断开，请稍后重试')
      set((state) => {
        const { [targetSessionId]: _, ...rest } = state.sessionRuntimes
        return { sessionRuntimes: rest }
      })
      return
    }

    // 启动发送超时定时器
    const timer = setTimeout(() => {
      sendTimeouts.delete(targetSessionId)
      const runtime = get().sessionRuntimes[targetSessionId]
      if (runtime && runtime.assistantMsgId === aiMsgId) {
        get().updateMessageStatus(targetSessionId, aiMsgId, 'error', '请求超时，请重试')
        set((state) => {
          const { [targetSessionId]: _, ...rest } = state.sessionRuntimes
          return { sessionRuntimes: rest }
        })
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
    ws.sendAbort(currentConversationId, runtime.requestId)

    const messages = get().messagesBySession[currentConversationId] || []
    messages.forEach((m) => {
      if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
        get().updateMessageStatus(currentConversationId!, m.id, 'error', '已停止生成')
      }
    })

    set((state) => {
      const { [currentConversationId!]: _, ...rest } = state.sessionRuntimes
      return { sessionRuntimes: rest }
    })
  },

  // ====== 技能 ======

  loadWorkflows: async () => {
    const all = await chatApi.getWorkflows()
    const basic = all.find((w) => w.type === 1) || null
    const skills = all.filter((w) => w.type === 2)
    set({ defaultWorkflow: basic, skills })
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

  setSessionOccupied: (sessionId: string, occupied: boolean) => {
    set((state) => ({
      sessionOccupied: { ...state.sessionOccupied, [sessionId]: occupied },
    }))
  },

  // ====== WebSocket 事件处理注册 ======

  initWsHandlers: () => {
    // 流式分片（优先 session_id，兜底 request_id）
    ws.on('stream_chunk', (data: WsStreamChunkData) => {
      const { sessionRuntimes } = get()
      const runtimeKey =
        (sessionRuntimes[data.session_id] ? data.session_id : null) ||
        findSessionByRequestId(sessionRuntimes, data.request_id)
      if (!runtimeKey) return
      clearSendTimeout(runtimeKey)

      const runtime = sessionRuntimes[runtimeKey]
      const messages = get().messagesBySession[runtimeKey] || []
      const msg = messages.find((m) => m.id === runtime.assistantMsgId)
      if (!msg) return

      const newContent = msg.content + data.content
      get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'streaming', newContent)

      set((state) => ({
        sessionRuntimes: {
          ...state.sessionRuntimes,
          [runtimeKey]: { ...runtime, status: 'streaming' },
        },
      }))
    })

    // 流式结束（优先 session_id，兜底 request_id，含 pending 迁移）
    ws.on('stream_done', (data: WsStreamDoneData) => {
      const { sessionRuntimes, currentConversationId } = get()
      const runtimeKey =
        (sessionRuntimes[data.session_id] ? data.session_id : null) ||
        findSessionByRequestId(sessionRuntimes, data.request_id)
      if (!runtimeKey) return
      clearSendTimeout(runtimeKey)

      const runtime = sessionRuntimes[runtimeKey]
      get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'success', data.content)

      // 新会话：pending -> real session 迁移
      if (currentConversationId?.startsWith('pending-')) {
        set((state) => {
          const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
          const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession

          const newConv: Conversation = {
            ...(pendingConv as Conversation),
            id: data.session_id,
            title: data.content.slice(0, 10) || '新对话',
          }

          const { [runtimeKey]: doneRuntime, ...restRuntimes } = state.sessionRuntimes

          return {
            currentConversationId: data.session_id,
            conversations: { [data.session_id]: newConv, ...restConvs },
            messagesBySession: { [data.session_id]: pendingMsgs || [], ...restMsgs },
            sessionRuntimes: restRuntimes,
          }
        })
        ws.setCurrentSession(data.session_id)
      } else {
        // 清理 runtime
        set((state) => {
          const { [runtimeKey]: _, ...rest } = state.sessionRuntimes
          return { sessionRuntimes: rest }
        })
      }
    })

    // 非流式回复（优先 session_id，兜底 request_id，含 pending 迁移）
    ws.on('reply', (data: WsReplyData) => {
      const { sessionRuntimes, currentConversationId } = get()
      const runtimeKey =
        (sessionRuntimes[data.session_id] ? data.session_id : null) ||
        findSessionByRequestId(sessionRuntimes, data.request_id)
      if (!runtimeKey) return
      clearSendTimeout(runtimeKey)

      const runtime = sessionRuntimes[runtimeKey]
      get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'success', data.content)

      // 新会话：pending -> real session 迁移
      if (currentConversationId?.startsWith('pending-')) {
        set((state) => {
          const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
          const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession

          const newConv: Conversation = {
            ...(pendingConv as Conversation),
            id: data.session_id,
            title: data.content.slice(0, 10) || '新对话',
          }

          const { [runtimeKey]: doneRuntime, ...restRuntimes } = state.sessionRuntimes

          return {
            currentConversationId: data.session_id,
            conversations: { [data.session_id]: newConv, ...restConvs },
            messagesBySession: { [data.session_id]: pendingMsgs || [], ...restMsgs },
            sessionRuntimes: restRuntimes,
          }
        })
        ws.setCurrentSession(data.session_id)
      } else {
        // 清理 runtime
        set((state) => {
          const { [runtimeKey]: _, ...rest } = state.sessionRuntimes
          return { sessionRuntimes: rest }
        })
      }
    })

    // 错误处理（优先 session_id，兜底 request_id）
    ws.on('error', (data: WsErrorData) => {
      if (data.code === WS_ERROR_CODES.SESSION_OCCUPIED && data.session_id) {
        get().setSessionOccupied(data.session_id, true)
        Taro.showToast({ title: '该会话正在其他设备使用，仅可浏览', icon: 'none' })
        return
      }

      const { sessionRuntimes } = get()
      const targetSessionId =
        (data.session_id && sessionRuntimes[data.session_id] ? data.session_id : null) ||
        (data.request_id ? findSessionByRequestId(sessionRuntimes, data.request_id) : undefined)

      if (targetSessionId) {
        clearSendTimeout(targetSessionId)
        const runtime = sessionRuntimes[targetSessionId]
        if (runtime) {
          get().updateMessageStatus(
            targetSessionId,
            runtime.assistantMsgId,
            'error',
            data.message || '发送失败'
          )
          set((state) => {
            const { [targetSessionId]: _, ...rest } = state.sessionRuntimes
            return { sessionRuntimes: rest }
          })
        }
      }

      Taro.showToast({ title: data.message || '请求失败', icon: 'none' })
    })

    // 中断确认（优先 session_id，兜底 request_id）
    ws.on('abort_result', (data: WsAbortResultData) => {
      const { sessionRuntimes } = get()
      const runtimeKey =
        (data.session_id && sessionRuntimes[data.session_id] ? data.session_id : null) ||
        (data.request_id ? findSessionByRequestId(sessionRuntimes, data.request_id) : undefined)

      if (runtimeKey) {
        clearSendTimeout(runtimeKey)
        const messages = get().messagesBySession[runtimeKey] || []
        messages.forEach((m) => {
          if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
            get().updateMessageStatus(runtimeKey, m.id, 'error', '已停止生成')
          }
        })
        set((state) => {
          const { [runtimeKey]: _, ...rest } = state.sessionRuntimes
          return { sessionRuntimes: rest }
        })
      }
    })

    // 会话释放
    ws.on('session_released', (data: WsSessionReleasedData) => {
      get().setSessionOccupied(data.session_id, false)
      Taro.showToast({ title: '会话已可使用', icon: 'none' })
    })

    // 连接状态
    ws.on('connected', () => {
      get().setWsConnected(true)
    })

    ws.on('disconnect', () => {
      get().setWsConnected(false)
    })
  },
}))
