import { create } from 'zustand'
import { getTaskStatus } from '@/api/creation'
import type { GenerateTaskResult } from '@/types/creation'
import type { WsGameGenerateStatusData } from '@/types/ws'

export type TaskStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed'

interface TaskState {
  recordId: number | null
  status: TaskStatus
  statusText: string
  result: GenerateTaskResult | null
  error: string | null
  businessType: string

  startTask: (recordId: number, businessType: string) => void
  handleWsStatus: (data: WsGameGenerateStatusData) => void
  fallbackQuery: () => Promise<void>
  stopTask: () => void
  reset: () => void
}

// WS status → TaskStatus 映射
const wsStatusMap: Record<string, TaskStatus> = {
  queued: 'pending',
  generating: 'processing',
  success: 'completed',
  failed: 'failed',
}

export const useTaskStore = create<TaskState>((set, get) => ({
  recordId: null,
  status: 'idle',
  statusText: '',
  result: null,
  error: null,
  businessType: 'game',

  startTask: (recordId: number, businessType: string) => {
    set({
      recordId,
      businessType,
      status: 'pending',
      statusText: '排队中',
      result: null,
      error: null,
    })
  },

  handleWsStatus: (data: WsGameGenerateStatusData) => {
    const { recordId } = get()
    if (recordId === null || data.record_id !== recordId) return

    const mapped = wsStatusMap[data.status]
    if (!mapped) return

    if (mapped === 'completed') {
      set({
        status: 'completed',
        statusText: data.message || '生成成功',
        result: data.result
          ? ({
              record_id: data.record_id,
              status: 1,
              status_text: data.message,
              game_name: data.result.game_name,
              generated_content: data.result.generated_content,
              music: data.result.music,
            } as GenerateTaskResult)
          : null,
      })
    } else if (mapped === 'failed') {
      set({
        status: 'failed',
        statusText: data.message || '生成失败',
        error: data.error || '生成失败',
      })
    } else {
      set({
        status: mapped,
        statusText: data.message || (mapped === 'pending' ? '排队中' : '生成中'),
      })
    }
  },

  /** 断线重连/页面刷新时，兜底查询一次当前任务状态 */
  fallbackQuery: async () => {
    const { recordId, status } = get()
    if (recordId === null) return
    if (status === 'completed' || status === 'failed' || status === 'idle') return

    try {
      const res = await getTaskStatus(recordId)
      const statusMap: Record<number, TaskStatus> = {
        0: 'failed',
        1: 'completed',
        2: 'pending',
        3: 'processing',
      }
      const mapped = statusMap[res.status] || 'processing'

      if (mapped === 'completed') {
        set({ status: 'completed', statusText: res.status_text || '生成成功', result: res })
      } else if (mapped === 'failed') {
        set({
          status: 'failed',
          statusText: res.status_text || '生成失败',
          error: res.user_message || '生成失败',
          result: res,
        })
      } else {
        set({ status: mapped, statusText: res.status_text || '生成中' })
      }
    } catch (e) {
      console.error('兜底查询任务状态失败:', e)
    }
  },

  stopTask: () => {
    set({ recordId: null })
  },

  reset: () => {
    set({
      recordId: null,
      status: 'idle',
      statusText: '',
      result: null,
      error: null,
      businessType: 'game',
    })
  },
}))
