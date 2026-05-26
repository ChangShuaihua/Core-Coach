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
