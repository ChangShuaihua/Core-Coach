import type { CreationMode } from '@/store/creationStore'

// 根据 status 获取状态文本
export const getStatusText = (status: number): string => {
  switch (status) {
    case 1:
      return '已开放'
    case 2:
      return '即将开放'
    default:
      return '未开放'
  }
}

// 根据 id 推断创作模式（当前仅游戏模式开放）
export const getModeBySkillId = (id: number): CreationMode => {
  switch (id) {
    case 1:
      return 'game'
    default:
      return 'game'
  }
}
