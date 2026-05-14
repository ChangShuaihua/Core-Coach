import { create } from 'zustand'

export type CreationMode = 'game' | 'lesson' | 'video' | null

interface CreationState {
  mode: CreationMode
  timestamp: number | null
  setMode: (mode: CreationMode) => void
  clearMode: () => void
  isValid: () => boolean
}

const EXPIRY_TIME = 5 * 60 * 1000 // 5分钟过期

export const useCreationStore = create<CreationState>((set, get) => ({
  mode: null,
  timestamp: null,

  setMode: (mode: CreationMode) => {
    set({
      mode,
      timestamp: Date.now(),
    })
  },

  clearMode: () => {
    set({
      mode: null,
      timestamp: null,
    })
  },

  isValid: () => {
    const { mode, timestamp } = get()
    if (!mode || !timestamp) return false

    const now = Date.now()
    const isExpired = now - timestamp > EXPIRY_TIME

    if (isExpired) {
      get().clearMode()
      return false
    }

    return true
  },
}))
