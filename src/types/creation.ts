// 技能/工坊卡片
export interface Skill {
  id: number
  flow_id: string
  description: string
  icon: string
  image_need: number // 0: emoji/icon, 1: 需要图片
  step_count: number
  status: number // 0: 未开放, 1: 已开放, 2: 即将开放
}

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

// 异步生成任务响应
export interface GenerateTaskResponse {
  record_id: number
  status: number
  status_text: string
  estimated_seconds: number
  message: string
}

// 任务状态：0=失败, 1=成功, 2=排队中, 3=生成中
export type TaskStatusCode = 0 | 1 | 2 | 3

// 查询任务结果
export interface GenerateTaskResult {
  record_id: number
  status: TaskStatusCode
  status_text: string
  age?: number
  game_type?: string
  game_name?: string
  generated_content?: string
  music?: string
  created_at?: string
  finished_at?: string
  user_message?: string
  estimated_seconds?: number
  retry_params?: {
    age: number
    game_type: string
  }
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

// 年龄配置
export interface AgeConfig {
  min: number
  max: number
  default: number
  unit: string
}

// 游戏类型选项
export interface GameType {
  name: string
  code: string
  status: number
}

// 获取游戏参数接口响应
export interface GameParamsResponse {
  age_config: AgeConfig
  game_type_options: GameType[]
}

// 游戏配置（用于 ParamSettings 组件）
export interface GameConfig {
  age_config: AgeConfig
  game_type_options: GameType[]
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
