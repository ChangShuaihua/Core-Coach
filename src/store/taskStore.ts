import { create } from 'zustand'
import { getTaskStatus } from '@/api/creation'
import type { GenerateTaskResult } from '@/types/creation'

export type TaskStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed'

interface TaskState {
  recordId: number | null
  status: TaskStatus
  statusText: string
  result: GenerateTaskResult | null
  error: string | null
  businessType: string
  pollTimer: ReturnType<typeof setInterval> | null

  startTask: (recordId: number, businessType: string) => void
  stopPoll: () => void
  reset: () => void
}

const POLL_INTERVAL = 2000

// 任务状态码映射
const statusMap: Record<number, TaskStatus> = {
  0: 'failed',
  1: 'completed',
  2: 'pending',
  3: 'processing',
}

export const useTaskStore = create<TaskState>((set, get) => ({
  recordId: null,
  status: 'idle',
  statusText: '',
  result: null,
  error: null,
  businessType: 'game',
  pollTimer: null,

  startTask: (recordId: number, businessType: string) => {
    const { pollTimer } = get()
    if (pollTimer) clearInterval(pollTimer)

    set({
      recordId,
      businessType,
      status: 'pending',
      statusText: '排队中',
      result: null,
      error: null,
    })

    const timer = setInterval(async () => {
      try {
        const res = await getTaskStatus(recordId)
        const mappedStatus = statusMap[res.status] || 'processing'

        if (mappedStatus === 'completed') {
          get().stopPoll()
          set({
            status: 'completed',
            statusText: res.status_text || '生成成功',
            result: res,
          })
        } else if (mappedStatus === 'failed') {
          get().stopPoll()
          set({
            status: 'failed',
            statusText: res.status_text || '生成失败',
            error: res.user_message || '生成失败',
            result: res,
          })
        } else {
          set({
            status: mappedStatus,
            statusText: res.status_text || '生成中',
          })
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
      recordId: null,
      status: 'idle',
      statusText: '',
      result: null,
      error: null,
      businessType: 'game',
      pollTimer: null,
    })
  },
}))
