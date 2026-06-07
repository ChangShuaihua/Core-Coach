import { create } from 'zustand'
import { getTaskStatus } from '@/api/creation'
import type { GenerateTaskResult } from '@/types/creation'
import type { WsGameGenerateStatusData, PendingTaskItem, StatusEventItem } from '@/types/ws'

export type TaskStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed'

interface TaskState {
  recordId: number | null
  status: TaskStatus
  statusText: string
  result: GenerateTaskResult | null
  error: string | null
  businessType: string
  statusVersion: number
  lastEventId: string

  startTask: (recordId: number, businessType: string) => void
  handleWsStatus: (data: WsGameGenerateStatusData) => void
  handlePendingTasks: (tasks: PendingTaskItem[]) => void
  handleStatusEvents: (events: StatusEventItem[], lastEventId: string) => void
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
  statusVersion: 0,
  lastEventId: '',

  startTask: (recordId: number, businessType: string) => {
    set({
      recordId,
      businessType,
      status: 'pending',
      statusText: '排队中',
      result: null,
      error: null,
      statusVersion: 0,
      lastEventId: '',
    })
  },

  handleWsStatus: (data: WsGameGenerateStatusData) => {
    const { recordId, statusVersion } = get()
    if (recordId === null || data.record_id !== recordId) return

    // 版本过滤：丢弃旧消息
    if (data.status_version && data.status_version <= statusVersion) return

    const mapped = wsStatusMap[data.status]
    if (!mapped) return

    const updates: Partial<TaskState> = {
      statusVersion: data.status_version || statusVersion,
      lastEventId: data.event_id || get().lastEventId,
    }

    if (mapped === 'completed') {
      updates.status = 'completed'
      updates.statusText = data.message || '生成成功'
      updates.result = data.result
        ? ({
            record_id: data.record_id,
            status: 1,
            status_text: data.message,
            game_name: data.result.game_name,
            generated_content: data.result.generated_content,
            music: data.result.music,
          } as GenerateTaskResult)
        : null
    } else if (mapped === 'failed') {
      updates.status = 'failed'
      updates.statusText = data.message || '生成失败'
      updates.error = data.error || '生成失败'
    } else {
      updates.status = mapped
      updates.statusText = data.message || (mapped === 'pending' ? '排队中' : '生成中')
    }

    set(updates as any)
  },

  handlePendingTasks: (tasks: PendingTaskItem[]) => {
    const { recordId, statusVersion } = get()
    if (recordId === null) return

    const task = tasks.find((t) => t.record_id === recordId)
    if (!task) return

    // 版本过滤
    if (task.status_version && task.status_version <= statusVersion) return

    const mapped = wsStatusMap[task.status]
    if (!mapped) return

    const updates: Partial<TaskState> = {
      statusVersion: task.status_version,
      lastEventId: task.event_id || get().lastEventId,
    }

    if (mapped === 'completed') {
      updates.status = 'completed'
      updates.statusText = task.message || '生成成功'
    } else if (mapped === 'failed') {
      updates.status = 'failed'
      updates.statusText = task.message || '生成失败'
    } else {
      updates.status = mapped
      updates.statusText = task.message || (mapped === 'pending' ? '排队中' : '生成中')
    }

    set(updates as any)
  },

  handleStatusEvents: (events: StatusEventItem[], newLastEventId: string) => {
    const { recordId } = get()
    if (recordId === null) return

    // 按 status_version 升序处理
    const sorted = events
      .filter((e) => e.record_id === recordId)
      .sort((a, b) => a.status_version - b.status_version)

    for (const event of sorted) {
      const { statusVersion } = get()
      if (event.status_version && event.status_version <= statusVersion) continue

      const mapped = wsStatusMap[event.status]
      if (!mapped) continue

      const updates: Partial<TaskState> = {
        statusVersion: event.status_version,
      }

      if (mapped === 'completed') {
        updates.status = 'completed'
        updates.statusText = event.message || '生成成功'
        updates.result = event.result
          ? ({
              record_id: event.record_id,
              status: 1,
              status_text: event.message,
              game_name: event.result.game_name,
              generated_content: event.result.generated_content,
              music: event.result.music,
            } as GenerateTaskResult)
          : null
      } else if (mapped === 'failed') {
        updates.status = 'failed'
        updates.statusText = event.message || '生成失败'
        updates.error = event.error || '生成失败'
      } else {
        updates.status = mapped
        updates.statusText = event.message || (mapped === 'pending' ? '排队中' : '生成中')
      }

      set(updates as any)
    }

    set({ lastEventId: newLastEventId })
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
      statusVersion: 0,
      lastEventId: '',
    })
  },
}))
