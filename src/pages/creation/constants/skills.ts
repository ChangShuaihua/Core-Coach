export interface Skill {
  id: number
  name: string
  icon: string
  status: 0 | 1 // 0: 未开放, 1: 已开放
  permissionKey: string
  target?: string // 点击跳转的目标页面（仅当 status=1 时使用）
}

// 根据 status 获取状态文本
export const getStatusText = (status: 0 | 1): string => {
  return status === 1 ? '已开放' : '即将开放'
}

export const SKILLS_MOCK_DATA: Skill[] = [
  {
    id: 1,
    name: '游戏生成',
    icon: '🎮',
    status: 1,
    permissionKey: 'game_gen',
    target: '/pages/wizard/index?mode=game',
  },
  {
    id: 2,
    name: '教案生成',
    icon: '📋',
    status: 0,
    permissionKey: 'lesson_plan',
  },
  {
    id: 3,
    name: '视频分析',
    icon: '🎬',
    status: 0,
    permissionKey: 'video_analysis',
  },
  {
    id: 4,
    name: '更多功能',
    icon: '➕',
    status: 0,
    permissionKey: 'more_features',
  },
]
