import type { Skill } from '@/pages/creation/constants/skills'
import { get } from './http'

const isDev = process.env.NODE_ENV === 'development'
// 强制使用 mock 数据（开发时可设置为 true 避免网络请求）
const FORCE_MOCK = true

/**
 * 获取技能列表（创作工坊列表）
 * 接口返回的数据会自动添加一个「敬请期待」卡片到最后
 * 开发环境下如果请求失败会自动使用 mock 数据
 */
export const getSkillList = async (): Promise<Skill[]> => {
  try {
    const skills = await get<Skill[]>('/skills/list', undefined, {
      showLoading: true,
    })

    // 定义固定的「敬请期待」卡片
    const moreSkill: Skill = {
      id: 9999,
      name: '更多功能',
      icon: '➕',
      status: 0,
      permissionKey: 'more_features',
    }

    // 将「敬请期待」卡片添加到列表最后
    return [...skills, moreSkill]
  } catch (error) {
    console.error('获取技能列表失败:', error)

    // 开发环境下返回 mock 数据
    if (isDev) {
      console.warn('开发环境：使用 mock 数据替代')
      const { SKILLS_MOCK_DATA } = await import('@/pages/creation/constants/skills')
      return SKILLS_MOCK_DATA
    }

    throw error
  }
}

/**
 * 获取单个技能详情
 * 开发环境下如果请求失败会自动使用 mock 数据
 */
export const getSkillDetail = async (id: number) => {
  // 如果强制使用 mock 数据，直接返回
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 技能ID:', id)
    const { getMockSkillConfig } = await import('@/pages/wizard/constants/skillConfig')

    // 根据 id 确定 mode
    const mode = id === 1 ? 'game' : id === 2 ? 'lesson' : 'game'
    return getMockSkillConfig(mode)
  }

  try {
    const result = await get(`/skills/detail?id=${id}`, undefined, {
      showLoading: true,
    })
    return result
  } catch (error) {
    console.error('获取技能详情失败:', error)

    // 开发环境下或请求失败时返回 mock 数据
    if (isDev) {
      console.warn('⚠️ 网络请求失败，使用 mock 数据替代')
      const { getMockSkillConfig } = await import('@/pages/wizard/constants/skillConfig')

      // 根据 id 确定 mode
      const mode = id === 1 ? 'game' : id === 2 ? 'lesson' : 'game'
      return getMockSkillConfig(mode)
    }

    throw error
  }
}
