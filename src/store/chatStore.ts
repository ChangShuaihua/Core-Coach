import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { Conversation, Message, MessageStatus, Skill } from '@/types/chat'

interface ChatStore {
  conversations: Conversation[]
  currentConversationId: string | null
  currentMessages: Message[]
  skills: Skill[]

  // 会话
  loadConversations: () => Promise<void>
  createConversation: () => Promise<string>
  getOrCreateConversation: () => Promise<string>
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>

  // 消息
  loadMessages: (conversationId: string) => Promise<void>
  appendMessage: (message: Message) => void
  updateMessageStatus: (id: string, status: MessageStatus, content?: string) => void

  // 技能
  loadSkills: () => Promise<void>
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  currentMessages: [],
  skills: [],

  // ========== 会话 ==========

  loadConversations: async () => {
    const conversations = await chatApi.getConversations()
    set({ conversations })
  },

  createConversation: async () => {
    const conv = await chatApi.createConversation()
    set((state) => ({
      conversations: [conv, ...state.conversations],
      currentConversationId: conv.id,
      currentMessages: [],
    }))
    return conv.id
  },

  getOrCreateConversation: async () => {
    const { conversations, currentConversationId } = get()
    // 查找已有的空会话（没发过消息）
    const emptyConv = conversations.find((c) => c.messageCount === 0)
    if (emptyConv) {
      if (currentConversationId !== emptyConv.id) {
        set({ currentConversationId: emptyConv.id, currentMessages: [] })
      }
      return emptyConv.id
    }
    return get().createConversation()
  },

  switchConversation: async (id: string) => {
    set({ currentConversationId: id, currentMessages: [] })
    const messages = await chatApi.getMessages(id)
    // 只有当前会话还是这个 id 时才更新，防止快速切换导致错位
    if (get().currentConversationId === id) {
      set({ currentMessages: messages })
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
    const messages = await chatApi.getMessages(conversationId)
    if (get().currentConversationId === conversationId) {
      set({ currentMessages: messages })
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
          lastMessage: message.content.slice(0, 30) || conv.lastMessage,
          updatedAt: message.timestamp,
          messageCount: updatedMessages.length,
        }
      })
      // 将当前会话排到最前面
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

  // ========== 技能 ==========

  loadSkills: async () => {
    const skills = await chatApi.getSkills()
    set({ skills })
  },
}))
