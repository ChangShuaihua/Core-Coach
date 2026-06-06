import Taro from '@tarojs/taro'
import * as chatApi from '@/api/chat'
import { ws } from '@/services/ws'
import type { ChatStore } from '@/types/chat'
import {
  clearSendTimeout,
  setSendTimeout,
  deleteSendTimeout,
  SEND_TIMEOUT_MS,
  clearRuntime,
  setAbortFallbackTimer,
  deleteAbortFallbackTimer,
} from './chatHelpers'

type Slice<T> = (set: (...args: any[]) => void, get: () => ChatStore) => T

export const createMessageSlice: Slice<
  Pick<
    ChatStore,
    | 'messagesBySession'
    | 'messageCursor'
    | 'hasMoreMessages'
    | 'isLoadingMore'
    | 'sessionRuntimes'
    | 'requestToSession'
    | 'lastStreamIds'
    | 'wsConnected'
    | 'sessionRoles'
    | 'loadMessages'
    | 'loadMoreMessages'
    | 'appendMessage'
    | 'updateMessageStatus'
    | 'updateMessageImages'
    | 'sendMessage'
    | 'stopResponding'
    | 'setWsConnected'
    | 'setSessionRole'
    | 'setLastStreamId'
  >
> = (set, get) => ({
  // ====== State ======
  messagesBySession: {},
  messageCursor: null,
  hasMoreMessages: true,
  isLoadingMore: false,
  sessionRuntimes: {},
  requestToSession: {},
  lastStreamIds: {},
  wsConnected: false,
  sessionRoles: {},

  // ====== 消息 Actions ======

  loadMessages: async (sessionId: string) => {
    if (sessionId.startsWith('pending-')) return
    if (get().sessionRuntimes[sessionId]) return

    const result = await chatApi.getMessages(sessionId)
    if (get().currentConversationId === sessionId) {
      set((state: ChatStore) => ({
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
        set((state: ChatStore) => ({
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

  appendMessage: (sessionId, message) => {
    set((state: ChatStore) => {
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

  updateMessageStatus: (sessionId, msgId, status, content) => {
    set((state: ChatStore) => {
      const messages = state.messagesBySession[sessionId] || []
      const updated = messages.map((m) =>
        m.id === msgId ? { ...m, status, ...(content !== undefined ? { content } : {}) } : m
      )
      return { messagesBySession: { ...state.messagesBySession, [sessionId]: updated } }
    })
  },

  updateMessageImages: (sessionId, msgId, images) => {
    set((state: ChatStore) => {
      const messages = state.messagesBySession[sessionId] || []
      const updated = messages.map((m) => (m.id === msgId ? { ...m, images } : m))
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

    const userMsg: import('@/types/chat').Message = {
      id: 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'success',
    }
    const aiMsgId = 'a-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    const aiMsg: import('@/types/chat').Message = {
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
    set((state: ChatStore) => ({
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
      image_need: currentWorkflow?.imageNeed ?? 0,
      create_time: Math.floor(Date.now() / 1000),
    })

    // 启动发送超时定时器
    const timer = setTimeout(() => {
      deleteSendTimeout(targetSessionId)
      const runtime = get().sessionRuntimes[targetSessionId]
      if (runtime && runtime.assistantMsgId === aiMsgId) {
        get().updateMessageStatus(targetSessionId, aiMsgId, 'error', '请求超时，请重试')
        clearRuntime(targetSessionId)
      }
    }, SEND_TIMEOUT_MS)
    setSendTimeout(targetSessionId, timer)

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
      deleteAbortFallbackTimer(requestId)
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
    setAbortFallbackTimer(requestId, timer)
  },

  // ====== WebSocket 状态 ======

  setWsConnected: (connected) => set({ wsConnected: connected }),

  setSessionRole: (sessionId, role) => {
    set((state: ChatStore) => ({
      sessionRoles: { ...state.sessionRoles, [sessionId]: role },
    }))
  },

  setLastStreamId: (sessionId, streamId) => {
    set((state: ChatStore) => ({
      lastStreamIds: { ...state.lastStreamIds, [sessionId]: streamId },
    }))
  },
})
