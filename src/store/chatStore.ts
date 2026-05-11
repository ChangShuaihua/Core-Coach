import { create } from 'zustand'
import { Conversation, Message } from '@/pages/chat/types'

interface ChatStore {
  conversations: Conversation[]
  currentConversationId: string | null
  currentMessages: Message[]

  addConversation: () => void
  switchConversation: (id: string) => void
  addMessage: (message: Message) => void
  refreshConversations: () => Promise<void>
  deleteConversation: (id: string) => void
}

// 用一个对象按 id 存储每个会话的消息，避免状态丢失
const messagesMap: Record<string, Message[]> = {}

// ========== Mock 假数据 ==========
const now = Date.now()
const hour = 3600 * 1000
const day = 24 * hour

const mockConversations: Conversation[] = [
  {
    id: 'mock-1',
    title: '如何提高核心力量',
    lastMessage: '可以尝试平板支撑、死虫式等动作...',
    updatedAt: now - 0.5 * hour,
    messageCount: 4,
  },
  {
    id: 'mock-2',
    title: '深蹲动作要领分析',
    lastMessage: '深蹲时需要注意膝盖不要超过脚尖太多...',
    updatedAt: now - 3 * hour,
    messageCount: 6,
  },
  {
    id: 'mock-3',
    title: '训练计划制定',
    lastMessage: '建议每周训练3-4次，每次45-60分钟...',
    updatedAt: now - 1.5 * day,
    messageCount: 8,
  },
  {
    id: 'mock-4',
    title: '蛋白质摄入量建议',
    lastMessage: '每公斤体重建议摄入1.6-2.2克蛋白质...',
    updatedAt: now - 2.5 * day,
    messageCount: 3,
  },
  {
    id: 'mock-5',
    title: '跑步后膝盖疼痛怎么办',
    lastMessage: '建议先休息几天，冰敷患处，如果持续疼痛请就医...',
    updatedAt: now - 10 * day,
    messageCount: 5,
  },
]

// 给每个 mock 会话填充一些消息
mockConversations.forEach((conv) => {
  messagesMap[conv.id] = [
    {
      id: `${conv.id}-u`,
      role: 'user',
      content: conv.title,
      timestamp: conv.updatedAt - 1000,
    },
    {
      id: `${conv.id}-a`,
      role: 'assistant',
      content: conv.lastMessage,
      timestamp: conv.updatedAt,
    },
  ]
})
// ========== Mock 结束 ==========

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: mockConversations,
  currentConversationId: null,
  currentMessages: [],

  // 新建会话
  addConversation: () => {
    const id = Date.now().toString()
    const newConversation: Conversation = {
      id,
      title: '新对话',
      lastMessage: '',
      updatedAt: Date.now(),
      messageCount: 0,
    }
    messagesMap[id] = []
    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: id,
      currentMessages: [],
    }))
  },

  // 切换会话
  switchConversation: (id: string) => {
    set({
      currentConversationId: id,
      currentMessages: messagesMap[id] || [],
    })
  },

  // 添加消息到当前会话
  addMessage: (message: Message) => {
    const { currentConversationId, conversations } = get()
    if (!currentConversationId) return

    // 更新 messagesMap
    if (!messagesMap[currentConversationId]) {
      messagesMap[currentConversationId] = []
    }
    messagesMap[currentConversationId].push(message)

    // 更新会话元信息
    const updatedConversations = conversations.map((conv) => {
      if (conv.id !== currentConversationId) return conv
      return {
        ...conv,
        // 标题：取第一条用户消息的内容（截取前20个字符）
        title:
          conv.title === '新对话' && message.role === 'user'
            ? message.content.slice(0, 20) || '新对话'
            : conv.title,
        lastMessage: message.content.slice(0, 30),
        updatedAt: message.timestamp,
        messageCount: (messagesMap[currentConversationId] || []).length,
      }
    })

    set({
      conversations: updatedConversations,
      currentMessages: [...messagesMap[currentConversationId]],
    })
  },

  // 下拉刷新（目前先模拟延迟）
  refreshConversations: async () => {
    // 后续接 API 时在这里请求数据
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // mock: 不做任何改变，实际会从服务端拉取
  },

  // 删除会话
  deleteConversation: (id: string) => {
    delete messagesMap[id]
    set((state) => {
      const newConversations = state.conversations.filter((c) => c.id !== id)
      // 如果删的是当前会话，切换到第一个或清空
      let newCurrentId = state.currentConversationId
      let newMessages = state.currentMessages
      if (state.currentConversationId === id) {
        newCurrentId = newConversations[0]?.id || null
        newMessages = newCurrentId ? messagesMap[newCurrentId] || [] : []
      }
      return {
        conversations: newConversations,
        currentConversationId: newCurrentId,
        currentMessages: newMessages,
      }
    })
  },
}))
