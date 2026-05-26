// 游戏收藏详情（/game/favorite/detail 响应）
export interface Game {
  id: number
  record_id: number
  game_name: string
  game_type: string
  age: number
  generated_content: string
  music: string
  music_url: string
  collected_at: string
}
