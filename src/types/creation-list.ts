export interface RecentCreation {
  id: number
  type: 'game' | 'lesson'
  title: string
  created_at: string
}

export interface RecentListResponse {
  list: RecentCreation[]
}

export interface DetailParams {
  id?: string
  type?: string
}

/**
 * /creation/list 接口请求参数
 */
export interface CreationListRequest {
  /**
   * 页码
   */
  page?: string
  /**
   * 一页展示数量
   */
  page_size?: string
  /**
   * 筛选记录的类型（游戏、教案、视频分析等）
   */
  type?: string
  [property: string]: any
}

/**
 * /creation/list 接口响应数据中的列表项
 */
export interface CreationListItem {
  id: number
  type: 'game' | 'lesson' | 'video'
  title: string
  description?: string
  created_at: string
  updated_at?: string
  status?: number
  [property: string]: any
}

/**
 * /creation/list 接口响应数据
 */
export interface CreationListResponse {
  list: CreationListItem[]
  total: number
  page: number
  page_size: number
  [property: string]: any
}

/**
 * /creation/list 接口完整响应
 */
export interface CreationListApiResponse {
  /**
   * 状态码
   */
  code: string
  data: CreationListResponse
  /**
   * 消息
   */
  message: string
  [property: string]: any
}
