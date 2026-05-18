export interface Skill {
  id: number
  flow_id: string
  description: string
  icon: string
  image_need: number // 0: emoji/icon, 1: 需要图片
  step_count: number
  status: number // 0: 未开放, 1: 已开放, 2: 即将开放
}

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

// 根据 id 推断创作模式
export const getModeBySkillId = (id: number): 'game' | 'lesson' | 'video' => {
  switch (id) {
    case 1:
      return 'game'
    case 2:
      return 'lesson'
    case 3:
      return 'video'
    default:
      return 'game'
  }
}

export const SKILLS_MOCK_DATA: Skill[] = [
  {
    id: 1,
    flow_id: '7610696574318297103',
    description: '游戏生成',
    icon: '🎮',
    image_need: 0,
    step_count: 5,
    status: 1,
  },
  {
    id: 2,
    flow_id: '7610696574318297104',
    description: '教案生成',
    icon: '📋',
    image_need: 0,
    step_count: 4,
    status: 2,
  },
  {
    id: 3,
    flow_id: '7610696574318297105',
    description: '视频分析',
    icon: '🎬',
    image_need: 1,
    step_count: 3,
    status: 2,
  },
]
