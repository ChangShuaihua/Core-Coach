import type { Game } from '@/data/mock/games'
import { get } from '../services/http'

const FORCE_MOCK = true

export interface RecentCreation {
  id: number
  type: 'game' | 'lesson'
  title: string
  created_at: string
}

interface RecentListResponse {
  list: RecentCreation[]
}

const mockRecentList: RecentCreation[] = [
  {
    id: 3,
    type: 'game',
    title: '小兔子跳跳的森林寻宝大冒险',
    created_at: '2026-05-14T09:13:39.816+08:00',
  },
  {
    id: 2,
    type: 'game',
    title: '小兔子的森林寻宝大冒险',
    created_at: '2026-05-13T21:35:14.391+08:00',
  },
  {
    id: 1,
    type: 'game',
    title: '小兔子的森林寻宝游戏',
    created_at: '2026-05-13T21:20:37.73+08:00',
  },
]

/**
 * 获取最近创作列表
 * 接口: GET /creation/recent
 */
export const getRecentCreations = async (): Promise<RecentCreation[]> => {
  if (FORCE_MOCK) {
    console.log('🎭 使用 Mock 数据 - 最近创作')
    return Promise.resolve(mockRecentList)
  }

  try {
    const res = await get<RecentListResponse>('/creation/recent', undefined, {
      showLoading: true,
    })
    return res.list
  } catch (error) {
    console.error('获取最近创作失败:', error)
    return mockRecentList
  }
}

/**
 * 获取游戏详情
 * 接口: GET /creation/game/:id
 */
export const getGameDetailById = async (id: number): Promise<Game> => {
  if (FORCE_MOCK) {
    console.log('🎭 使用 Mock 数据 - 游戏详情:', id)
    const { mockGames } = await import('@/data/mock/games')
    const game = mockGames.find((g) => g.id === id) || mockGames[0]
    return Promise.resolve(game)
  }

  try {
    const res = await get<Game>(`/creation/game/${id}`, undefined, {
      showLoading: true,
    })
    return res
  } catch (error) {
    console.error('获取游戏详情失败:', error)
    const { mockGames } = await import('@/data/mock/games')
    return mockGames.find((g) => g.id === id) || mockGames[0]
  }
}
