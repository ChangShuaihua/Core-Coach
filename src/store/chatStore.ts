import { create } from 'zustand'
import * as chatApi from '@/api/chat'
import { ws } from '@/services/ws'
import type { ChatStore } from '@/types/chat'
import { createConversationSlice } from './chatConversationSlice'
import { loadPersistedSkill, persistSkill } from './chatHelpers'
import { createMessageSlice } from './chatMessageSlice'

export {
  clearSendTimeout,
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
    const basic = all.find((w) => w.type === 1) || null
    const skills = all.filter((w) => w.type === 2)

    const { selectedSkill } = get()
    if (selectedSkill && !all.some((w) => w.id === selectedSkill.id)) {
      persistSkill(null)
      set({ defaultWorkflow: basic, skills, selectedSkill: null })
    } else {
      set({ defaultWorkflow: basic, skills })
    }
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
