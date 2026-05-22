/**
 * Mock 数据 - 技能配置
 * 用于本地开发和测试，模拟后端 API 返回的数据
 */

export const GAME_SKILL_CONFIG = {
  id: 1,
  name: '游戏生成',
  step_config: {
    steps: [
      {
        step: 1,
        title: '参数设置',
        type: 'param_settings',
        required: true,
      },
      {
        step: 2,
        title: '生成结果',
        type: 'result_preview',
        required: false,
      },
    ],
  },
}

export const LESSON_SKILL_CONFIG = {
  id: 2,
  name: '教案生成',
  step_config: {
    steps: [
      {
        step: 1,
        title: '选择运动类型',
        type: 'selector',
        options: [
          { label: '跑步', value: 'running', icon: 'https://via.placeholder.com/80?text=running' },
          { label: '跳跃', value: 'jumping', icon: 'https://via.placeholder.com/80?text=jumping' },
          {
            label: '投掷',
            value: 'throwing',
            icon: 'https://via.placeholder.com/80?text=throwing',
          },
          { label: '平衡', value: 'balance', icon: 'https://via.placeholder.com/80?text=balance' },
        ],
        multiple: true,
        maxSelect: 3,
        required: true,
      },
      {
        step: 2,
        title: '教案信息',
        type: 'param_settings',
        required: true,
      },
    ],
  },
}

/**
 * 根据 mode 获取对应的 mock 配置
 */
export function getMockSkillConfig(mode: string | null) {
  switch (mode) {
    case 'game':
      return GAME_SKILL_CONFIG
    case 'lesson':
      return LESSON_SKILL_CONFIG
    default:
      return GAME_SKILL_CONFIG
  }
}

/**
 * 统一配置映射表
 * 根据业务类型一键获取对应的步骤配置
 */
export const configMap: Record<string, typeof GAME_SKILL_CONFIG> = {
  game: GAME_SKILL_CONFIG,
  lesson: LESSON_SKILL_CONFIG,
}

/**
 * 根据业务类型获取配置
 */
export function getConfigByType(businessType: string) {
  return configMap[businessType] || configMap.game
}
