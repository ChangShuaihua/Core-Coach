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
    | 'remoteStreamingSessions'
    | 'remoteDirtySessions'
    | 'wsConnected'
    | 'sessionRoles'
    | 'loadMessages'
    | 'loadMoreMessages'
    | 'appendMessage'
    | 'updateMessageStatus'
    | 'updateMessageImages'
    | 'updateMessageOptions'
    | 'sendMessage'
    | 'stopResponding'
    | 'setWsConnected'
    | 'setSessionRole'
    | 'setLastStreamId'
    | 'markRemoteStreaming'
    | 'clearRemoteStreaming'
    | 'markRemoteDirty'
    | 'clearRemoteDirty'
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
  remoteStreamingSessions: {},
  remoteDirtySessions: {},
  wsConnected: false,
  sessionRoles: {},

  // ====== 消息 Actions ======

  loadMessages: async (sessionId: string, options?: { force?: boolean }) => {
    if (sessionId.startsWith('pending-')) return
    if (!options?.force && get().sessionRuntimes[sessionId]) return

    const result = await chatApi.getMessages(sessionId)
    if (get().currentConversationId === sessionId) {
      set((state: ChatStore) => ({
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: withRemotePendingIfNeeded(sessionId, result.messages, state),
        },
        messageCursor: result.nextCursor,
        hasMoreMessages: result.hasMore,
        remoteDirtySessions: omitSession(state.remoteDirtySessions, sessionId),
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

  updateMessageOptions: (sessionId, msgId, options) => {
    set((state: ChatStore) => {
      const messages = state.messagesBySession[sessionId] || []
      const nextOptions = options?.length ? options : undefined
      const updated = messages.map((m) => (m.id === msgId ? { ...m, options: nextOptions } : m))
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

    // 断连时不做本地乐观插入，避免出现未入库的“假消息”
    if (!ws.canSend()) {
      ws.tryReconnect()
      Taro.showToast({ title: '连接断开，正在重连，请稍后再发', icon: 'none' })
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
    if (!runtime?.requestId) {
      Taro.showToast({ title: '只有发起该问题的设备才能中断', icon: 'none' })
      return
    }

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

  markRemoteStreaming: (sessionId) => {
    set((state: ChatStore) => ({
      remoteStreamingSessions: { ...state.remoteStreamingSessions, [sessionId]: true },
    }))
  },

  clearRemoteStreaming: (sessionId) => {
    set((state: ChatStore) => {
      const { [sessionId]: _, ...rest } = state.remoteStreamingSessions
      return { remoteStreamingSessions: rest }
    })
  },

  markRemoteDirty: (sessionId) => {
    set((state: ChatStore) => ({
      remoteDirtySessions: { ...state.remoteDirtySessions, [sessionId]: true },
    }))
  },

  clearRemoteDirty: (sessionId) => {
    set((state: ChatStore) => {
      const { [sessionId]: _, ...rest } = state.remoteDirtySessions
      return { remoteDirtySessions: rest }
    })
  },
})

function withRemotePendingIfNeeded(
  sessionId: string,
  messages: import('@/types/chat').Message[],
  state: ChatStore
) {
  if (!messages.length) return messages

  const hasActiveAssistant = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )
  if (hasActiveAssistant) return messages

  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role !== 'user') return messages

  const hasUnansweredUserMessage = !messages.some(
    (m) => m.role === 'assistant' && (m.status === 'success' || m.status === 'error')
  )

  const isRecent = Date.now() - lastMessage.timestamp < 3 * 60 * 1000
  const shouldShowPending =
    isRecent &&
    (hasUnansweredUserMessage ||
      state.remoteStreamingSessions[sessionId] ||
      state.remoteDirtySessions[sessionId] ||
      state.sessionRoles[sessionId] === 'viewer' ||
      state.conversations[sessionId]?.hasOtherDevice)

  if (!shouldShowPending) return messages

  return [
    ...messages,
    {
      id: `remote-pending-${sessionId}-${lastMessage.id}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'pending',
    } satisfies import('@/types/chat').Message,
  ]
}

function omitSession(record: Record<string, boolean>, sessionId: string) {
  const { [sessionId]: _, ...rest } = record
  return rest
}
