export interface Skill {
  id: number
  name: string
  icon: string
  status: 'active' | 'coming_soon' | 'disabled'
  statusText: string
  badge?: 'hot' | 'new'
  permissionKey: string
  workflowId?: string
  sortOrder: number
  hasStepConfig: boolean
  action: {
    type: 'navigate' | 'webview' | 'custom' | 'toast'
    target?: string
    message?: string
  }
}

export const SKILLS_MOCK_DATA: Skill[] = [
  {
    id: 1,
    name: '游戏生成',
    icon: '🎮',
    status: 'active',
    statusText: '已开放',
    badge: 'hot',
    permissionKey: 'game_gen',
    workflowId: 'PK_Game_Generator',
    sortOrder: 1,
    hasStepConfig: true,
    action: {
      type: 'navigate',
      target: '/pages/wizard/index?mode=game',
    },
  },
  {
    id: 2,
    name: '教案生成',
    icon: '📋',
    status: 'coming_soon',
    statusText: '即将开放',
    permissionKey: 'lesson_plan',
    sortOrder: 2,
    hasStepConfig: false,
    action: {
      type: 'toast',
      message: '功能开发中，敬请期待',
    },
  },
  {
    id: 3,
    name: '视频分析',
    icon: '🎬',
    status: 'coming_soon',
    statusText: '即将开放',
    permissionKey: 'video_analysis',
    sortOrder: 3,
    hasStepConfig: false,
    action: {
      type: 'toast',
      message: '功能开发中，敬请期待',
    },
  },
  {
    id: 4,
    name: '更多功能',
    icon: '➕',
    status: 'coming_soon',
    statusText: '敬请期待',
    permissionKey: 'more_features',
    sortOrder: 4,
    hasStepConfig: false,
    action: {
      type: 'toast',
      message: '更多功能开发中',
    },
  },
]
