import * as chatApi from '@/api/chat'
import { ws } from '@/services/ws'
import type { ChatStore, Conversation } from '@/types/chat'

type Slice<T> = (set: (...args: any[]) => void, get: () => ChatStore) => T

export const createConversationSlice: Slice<
  Pick<
    ChatStore,
    | 'conversations'
    | 'currentConversationId'
    | 'conversationCursor'
    | 'hasMoreConversations'
    | 'isLoadingMoreConversations'
    | 'loadConversations'
    | 'loadMoreConversations'
    | 'ensurePendingConversation'
    | 'switchConversation'
    | 'deleteConversation'
    | 'addConversation'
    | 'updateConversation'
  >
> = (set, get) => ({
  // ====== State ======
  conversations: {},
  currentConversationId: null,
  conversationCursor: null,
  hasMoreConversations: true,
  isLoadingMoreConversations: false,

  // ====== Actions ======

  loadConversations: async () => {
    const result = await chatApi.getConversations()
    const { conversations, sessionRuntimes } = get()

    // 有 pending 会话正在等待 server 响应时，跳过添加新会话
    const hasPendingWithRuntime = Object.keys(conversations).some(
      (id) => id.startsWith('pending-') && sessionRuntimes[id]
    )

    const merged: Record<string, Conversation> = { ...conversations }
    result.conversations.forEach((conv) => {
      if (!merged[conv.id]) {
        if (hasPendingWithRuntime) return
        merged[conv.id] = conv
      } else {
        merged[conv.id] = {
          ...merged[conv.id],
          title: conv.title,
          updatedAt: conv.updatedAt,
          hasOtherDevice: conv.hasOtherDevice,
        }
      }
    })

    set({
      conversations: merged,
      conversationCursor: result.nextCursor,
      hasMoreConversations: result.hasMore,
    })
  },

  loadMoreConversations: async () => {
    const { conversationCursor, hasMoreConversations, isLoadingMoreConversations } = get()
    if (!hasMoreConversations || isLoadingMoreConversations || !conversationCursor) return

    set({ isLoadingMoreConversations: true })
    try {
      const result = await chatApi.getConversations(conversationCursor)
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

      set({
        conversations: merged,
        conversationCursor: result.nextCursor,
        hasMoreConversations: result.hasMore,
      })
    } finally {
      set({ isLoadingMoreConversations: false })
    }
  },

  ensurePendingConversation: () => {
    const { conversations, currentConversationId, sessionRuntimes } = get()

    // 离开旧会话
    if (currentConversationId) {
      if (!currentConversationId.startsWith('pending-')) {
        ws.send('session_leave', {
          session_id: currentConversationId,
          create_time: Math.floor(Date.now() / 1000),
        })
      }
    }

    // 查找空闲的 pending 会话（没有活跃 runtime 的）
    const idlePending = Object.values(conversations).find(
      (c) => c.id.startsWith('pending-') && !sessionRuntimes[c.id]
    )

    if (idlePending) {
      set({ currentConversationId: idlePending.id })
    } else {
      const tempId = 'pending-' + Date.now()
      const tempConv: Conversation = {
        id: tempId,
        title: '新对话',
        updatedAt: Date.now(),
        messageCount: 0,
        hasOtherDevice: false,
      }
      set((state: ChatStore) => ({
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
      set((state: ChatStore) => ({
        messagesBySession: { ...state.messagesBySession, [id]: result.messages },
        messageCursor: result.nextCursor,
        hasMoreMessages: result.hasMore,
      }))
    }
  },

  deleteConversation: async (id: string) => {
    const { currentConversationId } = get()
    const isDeletingCurrent = currentConversationId === id

    // pending 会话直接本地清理
    if (id.startsWith('pending-')) {
      set((state: ChatStore) => {
        const { [id]: _, ...restConvs } = state.conversations
        const { [id]: __, ...restMsgs } = state.messagesBySession
        return {
          conversations: restConvs,
          messagesBySession: restMsgs,
        }
      })
      if (isDeletingCurrent) {
        get().ensurePendingConversation()
      }
      return
    }

    // 调 API 删除
    await chatApi.deleteSession(id)

    // API 成功后清理本地状态
    set((state: ChatStore) => {
      const { [id]: _, ...restConvs } = state.conversations
      const { [id]: __, ...restMsgs } = state.messagesBySession
      return {
        conversations: restConvs,
        messagesBySession: restMsgs,
      }
    })

    if (isDeletingCurrent) {
      get().ensurePendingConversation()
    }
  },

  addConversation: (conv) => {
    set((state: ChatStore) => ({
      conversations: { ...state.conversations, [conv.id]: conv },
    }))
  },

  updateConversation: (id, updates) => {
    set((state: ChatStore) => {
      const conv = state.conversations[id]
      if (!conv) return state
      return {
        conversations: { ...state.conversations, [id]: { ...conv, ...updates } },
      }
    })
  },
})
