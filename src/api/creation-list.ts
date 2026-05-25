import type { Game } from '@/types/creation'
import type {
  DetailParams,
  RecentCreation,
  RecentListResponse,
  CreationListRequest,
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
 * 获取游戏详情
 * 接口: GET /creation/game/:id
 * 返回: { code: 0, message: "成功", data: Game }
 */
export const getGameDetailById = async (data: DetailParams): Promise<Game> => {
  const res = await get<Game>(`/creation/detail`, data)
  return res.data
}

/**
 * 获取全部创作列表（支持分页和类型筛选）
 * 接口: GET /creation/list
 * 请求参数: { page?: string, page_size?: string, type?: string }
 * 返回: { code: 0, message: "成功", data: { list: CreationListItem[], total: number, page: number, page_size: number } }
 */
export const getCreationList = async (
  params?: CreationListRequest
): Promise<CreationListResponse> => {
  const res = await get<CreationListResponse>('/creation/list', params)
  return res.data
}
