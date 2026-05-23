import { create } from 'zustand'
import { getTaskStatus } from '@/api/creation'

export type TaskStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed'

interface TaskState {
  taskId: string | null
  status: TaskStatus
  progress: number
  result: any | null
  error: string | null
  businessType: string
  pollTimer: ReturnType<typeof setInterval> | null

  startTask: (taskId: string, businessType: string) => void
  stopPoll: () => void
  reset: () => void
}

const POLL_INTERVAL = 2000

export const useTaskStore = create<TaskState>((set, get) => ({
  taskId: null,
  status: 'idle',
  progress: 0,
  result: null,
  error: null,
  businessType: 'game',
  pollTimer: null,

  startTask: (taskId: string, businessType: string) => {
    const { pollTimer } = get()
    if (pollTimer) clearInterval(pollTimer)

    set({
      taskId,
      businessType,
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
    })

    const timer = setInterval(async () => {
      try {
        const res = await getTaskStatus(taskId)
        const { status, progress, data } = res

        if (status === 'completed') {
          get().stopPoll()
          set({ status: 'completed', progress: 100, result: data })
        } else if (status === 'failed') {
          get().stopPoll()
          set({ status: 'failed', error: data?.message || '生成失败' })
        } else {
          set({ status: (status as TaskStatus) || 'processing', progress: progress || 0 })
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }
    }, POLL_INTERVAL)

    set({ pollTimer: timer })
  },

  stopPoll: () => {
    const { pollTimer } = get()
    if (pollTimer) {
      clearInterval(pollTimer)
      set({ pollTimer: null })
    }
  },

  reset: () => {
    const { pollTimer } = get()
    if (pollTimer) clearInterval(pollTimer)
    set({
      taskId: null,
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
      businessType: 'game',
      pollTimer: null,
    })
  },
}))
