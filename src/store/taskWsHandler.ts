import { ws } from '@/services/ws'
import type { WsGameGenerateStatusData } from '@/types/ws'
import { useTaskStore } from './taskStore'

// 外部订阅回调（creation 页面等用于实时更新列表）
type StatusListener = (data: WsGameGenerateStatusData) => void
const listeners = new Set<StatusListener>()

/** 订阅游戏生成状态推送，返回取消订阅函数 */
export function onGameGenerateStatus(listener: StatusListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// WS status → RecentCreation.status 数字映射
const wsStatusToNum: Record<string, number> = {
  queued: 2,
  generating: 3,
  success: 1,
  failed: 0,
}

/** 将 WS 推送状态转为 RecentCreation 的 status 数字 */
export function mapWsStatus(status: string): number | undefined {
  return wsStatusToNum[status]
}

/**
 * 注册游戏生成任务的 WS 事件处理
 * 在 app 初始化时调用一次即可，全局生效
 */
export function initTaskWsHandlers() {
  // 接收服务端推送的游戏生成状态
  ws.on('game_generate_status', (data: WsGameGenerateStatusData) => {
    console.log('[TaskWS] game_generate_status:', data.record_id, data.status)
    useTaskStore.getState().handleWsStatus(data)

    // 通知所有外部订阅者
    listeners.forEach((fn) => {
      try {
        fn(data)
      } catch (e) {
        console.error('[TaskWS] listener error:', e)
      }
    })
  })

  // 断线重连成功后，兜底查询一次进行中的任务状态
  ws.on('connected', () => {
    const { status, fallbackQuery } = useTaskStore.getState()
    if (status === 'pending' || status === 'processing') {
      console.log('[TaskWS] reconnected, fallback query for active task')
      fallbackQuery()
    }
  })
}
