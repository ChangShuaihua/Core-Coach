import type { Game } from '@/types/creation'
import type {
  DetailParams,
  RecentCreation,
  RecentListResponse,
  CreationListResponse,
} from '@/types/creation-list'
import { get } from '../services/http'

/**
 * 获取最近创作列表
 * 接口: GET /creation/recent
 * 返回: { code: 0, message: "成功", data: { list: RecentCreation[] } }
 */
export const getRecentCreations = async (): Promise<RecentCreation[]> => {
  const res = await get<RecentListResponse>('/creation/recent')
  return res.data?.list || []
}

/**
 * 获取全部创作列表（分页）
 * 接口: GET /creation/list
 * 返回: { code: 0, message: "成功", data: { list, total, page, page_size } }
 */
export const getCreationList = async (params: {
  page: number
  page_size: number
}): Promise<CreationListResponse> => {
  const res = await get<CreationListResponse>('/creation/list', params as Record<string, any>)
  return res.data
}

/**
 * 获取游戏详情
 * 接口: GET /creation/game/:id
 * 返回: { code: 0, message: "成功", data: Game }
 */
export const getGameDetailById = async (data: DetailParams): Promise<Game> => {
  const res = await get<Game>(`/creation/detail`, data)
  return res.data
}
