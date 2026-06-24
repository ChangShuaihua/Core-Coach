import type { TaskStatus } from '@/types/creation'

// 创作任务状态映射：0=失败, 1=成功, 2=排队中, 3=生成中
export const STATUS_CONFIG: Record<number, { text: string; icon: string }> = {
  0: { text: '生成失败', icon: '😢' },
  1: { text: '', icon: '' },
  2: { text: '排队中', icon: '⏳' },
  3: { text: '生成中', icon: '✨' },
}

// WS status 字符串 → 前端 TaskStatus
export const WS_STATUS_TO_TASK_STATUS: Record<string, TaskStatus> = {
  queued: 'pending',
  generating: 'processing',
  success: 'completed',
  failed: 'failed',
}

// WS status 字符串 → 后端数字状态码（0/1/2/3，用于 RecentCreation.status 等）
export const WS_STATUS_TO_NUM: Record<string, number> = {
  queued: 2,
  generating: 3,
  success: 1,
  failed: 0,
}

// HTTP 任务详情接口返回的数字状态码 → 前端 TaskStatus
export const TASK_STATUS_CODE_TO_TASK_STATUS: Record<number, TaskStatus> = {
  0: 'failed',
  1: 'completed',
  2: 'pending',
  3: 'processing',
}
