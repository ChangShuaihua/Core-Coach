import type { Skill } from '@/pages/creation/constants/skills'
import { get } from '../services/http'

const isDev = process.env.NODE_ENV === 'development'
// 强制使用 mock 数据（开发时可设置为 true 避免网络请求）
const FORCE_MOCK = true

// 默认的「更多功能」卡片，始终追加在列表末尾
const MORE_SKILL: Skill = {
  id: 9999,
  flow_id: '',
  description: '更多功能',
  icon: '➕',
  image_need: 0,
  step_count: 0,
  status: 0,
}

const mockSkillList: Skill[] = [
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

interface SkillListResponse {
  list: Skill[]
}

export interface GameType {
  name: string
  code: string
  status: number
}

export interface AgeConfig {
  min: number
  max: number
  default: number
  unit: string
}

export interface GameConfig {
  game_types: GameType[]
  age_config: AgeConfig
}

const mockGameConfig: GameConfig = {
  game_types: [
    { name: '折返式', code: 'zhefan', status: 1 },
    { name: '循环式', code: 'loop', status: 1 },
    { name: '散点式', code: 'scatter', status: 1 },
  ],
  age_config: {
    min: 3,
    max: 12,
    default: 3,
    unit: '岁',
  },
}

/**
 * 获取技能列表（创作工坊）
 * 接口: GET /creation/skills
 * 返回: { code, message, data: { list: Skill[] } }
 */
export const getSkillList = async (): Promise<Skill[]> => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 技能列表')
    return Promise.resolve([...mockSkillList, MORE_SKILL])
  }

  try {
    const res = await get<SkillListResponse>('/creation/skills', undefined, {
      showLoading: true,
    })
    return [...res.list, MORE_SKILL]
  } catch (error) {
    console.error('获取技能列表失败:', error)

    if (isDev) {
      console.warn('开发环境：使用 mock 数据替代')
      return [...mockSkillList, MORE_SKILL]
    }

    throw error
  }
}

/**
 * 获取技能详情（向导配置）
 * 接口: GET /creation/skills/:id
 * 返回: { code, message, data: { step_config, name, ... } }
 */
export const getSkillDetail = async (id: number) => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 技能ID:', id)
    const { getMockSkillConfig } = await import('@/pages/wizard/constants/skillConfig')
    const mode = id === 1 ? 'game' : id === 2 ? 'lesson' : 'game'
    return getMockSkillConfig(mode)
  }

  try {
    const result = await get(`/creation/skills/${id}`, undefined, {
      showLoading: true,
    })
    return result
  } catch (error) {
    console.error('获取技能详情失败:', error)

    if (isDev) {
      console.warn('⚠️ 网络请求失败，使用 mock 数据替代')
      const { getMockSkillConfig } = await import('@/pages/wizard/constants/skillConfig')
      const mode = id === 1 ? 'game' : id === 2 ? 'lesson' : 'game'
      return getMockSkillConfig(mode)
    }

    throw error
  }
}

/**
 * 获取游戏配置（游戏类型 + 年龄配置）
 * 接口: GET /creation/game-config
 * 返回: { code, message, data: { game_types, age_config } }
 */
export const getGameConfig = async (): Promise<GameConfig> => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 游戏配置')
    return Promise.resolve(mockGameConfig)
  }

  try {
    const res = await get<GameConfig>('/creation/game-config', undefined, {
      showLoading: true,
    })
    return res
  } catch (error) {
    console.error('获取游戏配置失败:', error)

    if (isDev) {
      console.warn('开发环境：使用 mock 数据替代')
      return mockGameConfig
    }

    throw error
  }
}
