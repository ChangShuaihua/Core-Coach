import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { ws } from '@/services/ws'
import type { ChatStore } from '@/types/chat'
import { createConversationSlice } from './chatConversationSlice'
import {
  clearAbortFallbackTimer,
  clearSendTimeout,
  loadPersistedSkill,
  persistSkill,
} from './chatHelpers'
import { createMessageSlice } from './chatMessageSlice'

export {
  clearSendTimeout,
  restartSendTimeout,
  clearRuntime,
  clearAbortFallbackTimer,
  clearSkillStorage,
} from './chatHelpers'

export const useChatStore = create<ChatStore>()((set, get) => ({
  // ====== 组合 Slices ======
  ...createMessageSlice(set, get),
  ...createConversationSlice(set, get),

  // ====== 技能/工作流 State ======
  skills: [],
  defaultWorkflow: null,
  selectedSkill: loadPersistedSkill(),

  // ====== 技能/工作流 Actions ======

  loadWorkflows: async () => {
    const all = await chatApi.getWorkflows()
    const basic =
      all.find((w) => w.type === 1 && w.title.includes('基础问答')) ||
      all.find((w) => w.type === 1) ||
      null
    const skills = all.filter((w) => w.type === 2)

    const { selectedSkill } = get()
    if (!selectedSkill) {
      set({ defaultWorkflow: basic, skills })
      return
    }

    const latestSelectedSkill = skills.find((w) => w.id === selectedSkill.id)

    if (!latestSelectedSkill) {
      persistSkill(null)
      set({ defaultWorkflow: basic, skills, selectedSkill: null })
      return
    }

    persistSkill(latestSelectedSkill)
    set({ defaultWorkflow: basic, skills, selectedSkill: latestSelectedSkill })
  },

  toggleSkill: (skill) => {
    const { selectedSkill } = get()
    const next = selectedSkill?.id === skill.id ? null : skill
    persistSkill(next)
    set({ selectedSkill: next })
  },

  getCurrentWorkflowId: () => {
    const { selectedSkill, defaultWorkflow } = get()
    return selectedSkill?.id || defaultWorkflow?.id || ''
  },

  resetChat: () => {
    const { sessionRuntimes } = get()
    Object.values(sessionRuntimes).forEach((runtime) => {
      clearSendTimeout(runtime.requestId)
      clearAbortFallbackTimer(runtime.requestId)
    })
    persistSkill(null)
    set({
      conversations: {},
      messagesBySession: {},
      currentConversationId: null,
      skills: [],
      defaultWorkflow: null,
      selectedSkill: null,
      messageCursor: null,
      hasMoreMessages: true,
      isLoadingMore: false,
      conversationCursor: null,
      hasMoreConversations: true,
      isLoadingMoreConversations: false,
      wsConnected: false,
      sessionRoles: {},
      sessionRuntimes: {},
      requestToSession: {},
      lastStreamIds: {},
      remoteStreamingSessions: {},
      remoteDirtySessions: {},
    })
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
