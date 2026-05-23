export interface GenerateGameParams {
  age: number
  game_type: string
  player_count?: number
}

export interface GenerateGameResult {
  record_id: number
  age: number
  game_type: string
  scene_template: string
  game_name: string
  generated_content: string
  music: string
  created_at: string
}

// 游戏详情接口
export interface Game {
  id: number
  title: string
  content: string
  created_at: string
  type: 'game'
  age?: number
  game_type?: string
  player_count?: number
  music?: string
  preparation?: string[]
  playSteps?: string[]
}

// 获取游戏参数接口响应
export interface GameParamsResponse {
  age_config: {
    min: number
    max: number
    default: number
    unit: string
  }
  game_type_options: Array<{
    name: string
    code: string
    status: number
  }>
}

// 游戏配置（用于 ParamSettings 组件）
export interface GameConfig {
  age_config: {
    min: number
    max: number
    default: number
    unit: string
  }
  game_type_options: Array<{
    name: string
    code: string
    status: number
  }>
}

// 获取游戏配置
export const getGameConfig = async (): Promise<GameConfig> => {
  const { get } = await import('../services/http')
  const res = await get<GameConfig>('/creation/game/params')
  return res.data
}

// 音乐项
export interface MusicItem {
  id: number
  music_name: string
  music_url: string
  duration: string
}

// 当前音乐
export interface CurrentMusic {
  music_name: string
  music_url: string
}

// 获取音乐列表请求参数
export interface MusicListRequest {
  record_id?: number
  [property: string]: any
}

// 获取音乐列表响应数据
export interface MusicListData {
  current_music: CurrentMusic
  music_list: MusicItem[]
}

// 选择音乐请求参数
export interface MusicSelectRequest {
  music_id: number
  record_id: number
  [property: string]: any
}

// 通用响应
export interface ApiResponse<T = { [key: string]: any }> {
  code: number
  data: T
  message: string
  [property: string]: any
}
