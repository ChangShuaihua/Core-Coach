import Taro from '@tarojs/taro'
import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { ws } from '@/services/ws'
import { Conversation, Message, MessageStatus, Skill } from '@/types/chat'
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
  activeRequestId: string | null
  requestToAssistantMsg: Record<string, { sessionId: string; msgId: string }>

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
  activeRequestId: null,
  requestToAssistantMsg: {},

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
    const { currentConversationId } = get()
    if (currentConversationId && currentConversationId !== id) {
      ws.switchSession(currentConversationId, id)
    }
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
    set({
      activeRequestId: requestId,
      requestToAssistantMsg: {
        ...get().requestToAssistantMsg,
        [requestId]: { sessionId: targetSessionId, msgId: aiMsgId },
      },
    })

    ws.sendChat({
      output_type: currentWorkflow?.outputType === 0 ? 'sync' : 'stream',
      request_id: requestId,
      session_id: isNewConversation ? '' : currentConversationId!,
      content,
      workflow_id: workflowId,
      create_time: Math.floor(Date.now() / 1000),
    })

    return targetSessionId
  },

  // ====== 打断（通过 WebSocket） ======

  stopResponding: () => {
    const { activeRequestId, currentConversationId, messagesBySession } = get()
    if (activeRequestId && currentConversationId) {
      ws.sendAbort(currentConversationId, activeRequestId)
      // 标记 pending/streaming 消息为已停止
      const messages = messagesBySession[currentConversationId] || []
      messages.forEach((m) => {
        if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
          get().updateMessageStatus(currentConversationId, m.id, 'error', '已停止生成')
        }
      })
      set({ activeRequestId: null })
    }
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
    // 流式分片
    ws.on('stream_chunk', (data: WsStreamChunkData) => {
      const { requestToAssistantMsg } = get()
      const mapping = requestToAssistantMsg[data.request_id]
      if (!mapping) return

      const { sessionId, msgId } = mapping
      const messages = get().messagesBySession[sessionId] || []
      const msg = messages.find((m) => m.id === msgId)
      if (!msg) return

      // 追加内容，状态改为 streaming
      const newContent = msg.content + data.content
      get().updateMessageStatus(sessionId, msgId, 'streaming', newContent)
    })

    // 流式结束
    ws.on('stream_done', (data: WsStreamDoneData) => {
      const { requestToAssistantMsg, currentConversationId } = get()
      const mapping = requestToAssistantMsg[data.request_id]
      if (!mapping) return

      const { sessionId, msgId } = mapping
      // 使用服务端拼接的完整内容
      get().updateMessageStatus(sessionId, msgId, 'success', data.content)

      // 新会话：更新 sessionId
      if (currentConversationId?.startsWith('pending-')) {
        set((state) => {
          const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
          const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession

          const newConv: Conversation = {
            ...(pendingConv as Conversation),
            id: data.session_id,
            title: data.content.slice(0, 20) || '新对话',
          }

          return {
            currentConversationId: data.session_id,
            conversations: { [data.session_id]: newConv, ...restConvs },
            messagesBySession: { [data.session_id]: pendingMsgs || [], ...restMsgs },
          }
        })
        ws.setCurrentSession(data.session_id)
      }

      // 清理映射
      set((state) => {
        const { [data.request_id]: _, ...rest } = state.requestToAssistantMsg
        return { requestToAssistantMsg: rest, activeRequestId: null }
      })
    })

    // 非流式回复
    ws.on('reply', (data: WsReplyData) => {
      const { requestToAssistantMsg, currentConversationId } = get()
      const mapping = requestToAssistantMsg[data.request_id]
      if (!mapping) return

      const { sessionId, msgId } = mapping
      get().updateMessageStatus(sessionId, msgId, 'success', data.content)

      // 新会话：更新 sessionId
      if (currentConversationId?.startsWith('pending-')) {
        set((state) => {
          const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
          const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession

          const newConv: Conversation = {
            ...(pendingConv as Conversation),
            id: data.session_id,
            title: data.content.slice(0, 20) || '新对话',
          }

          return {
            currentConversationId: data.session_id,
            conversations: { [data.session_id]: newConv, ...restConvs },
            messagesBySession: { [data.session_id]: pendingMsgs || [], ...restMsgs },
          }
        })
        ws.setCurrentSession(data.session_id)
      }

      set((state) => {
        const { [data.request_id]: _, ...rest } = state.requestToAssistantMsg
        return { requestToAssistantMsg: rest, activeRequestId: null }
      })
    })

    // 错误处理
    ws.on('error', (data: WsErrorData) => {
      if (data.code === WS_ERROR_CODES.SESSION_OCCUPIED && data.session_id) {
        get().setSessionOccupied(data.session_id, true)
        Taro.showToast({ title: '该会话正在其他设备使用，仅可浏览', icon: 'none' })
        return
      }

      // 其他错误：标记对应消息为失败
      if (data.request_id) {
        const { requestToAssistantMsg } = get()
        const mapping = requestToAssistantMsg[data.request_id]
        if (mapping) {
          get().updateMessageStatus(
            mapping.sessionId,
            mapping.msgId,
            'error',
            data.message || '发送失败'
          )
          set((state) => {
            const { [data.request_id!]: _, ...rest } = state.requestToAssistantMsg
            return { requestToAssistantMsg: rest, activeRequestId: null }
          })
        }
      }

      Taro.showToast({ title: data.message || '请求失败', icon: 'none' })
    })

    // 中断确认
    ws.on('abort_result', (data: WsAbortResultData) => {
      if (data.session_id) {
        const messages = get().messagesBySession[data.session_id] || []
        messages.forEach((m) => {
          if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
            get().updateMessageStatus(data.session_id, m.id, 'error', '已停止生成')
          }
        })
      }
      set((state) => {
        const { [data.request_id]: _, ...rest } = state.requestToAssistantMsg
        return { requestToAssistantMsg: rest, activeRequestId: null }
      })
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
