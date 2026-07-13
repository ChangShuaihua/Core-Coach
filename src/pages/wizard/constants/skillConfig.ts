/**
 * Mock 数据 - 技能配置
 * 用于本地开发和测试，模拟后端 API 返回的数据
 */
import type { SkillStepConfig } from '@/components/Wizard'

export const GAME_SKILL_CONFIG = {
  id: 1,
  name: '游戏生成',
  step_config: {
    steps: [
      {
        step: 1,
        title: '参数设置',
        type: 'param_settings' as const,
        required: true,
      },
      {
        step: 2,
        title: '生成结果',
        type: 'result_preview' as const,
        required: false,
      },
    ],
  } as SkillStepConfig,
}

/**
 * 根据 mode 获取对应的 mock 配置
 */
export function getMockSkillConfig(mode: string | null) {
  switch (mode) {
    case 'game':
      return GAME_SKILL_CONFIG
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
}

/**
 * 根据业务类型获取配置
 */
export function getConfigByType(businessType: string) {
  return configMap[businessType] || configMap.game
}
