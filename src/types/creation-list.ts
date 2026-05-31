export interface RecentCreation {
  id: number
  type: 'game' | 'lesson'
  title: string
  created_at: string
  status?: number // 0=失败, 1=成功, 2=排队中, 3=生成中
  age?: number
  game_type?: string
}

export interface RecentListResponse {
  list: RecentCreation[]
}

export interface DetailParams {
  id?: string
  type?: string
}
