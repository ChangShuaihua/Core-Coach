export type Game = {
  id: number
  name?: string
  allDescription?: string
  duration?: string
  players?: number
  category?: string
  bgmUrl?: string
  playSteps?: string[]
  preparation: string[]
}
export type favoriteGame = {
  id: number
  record_id: number
  game_name: string
  game_type: string
  collected_at: string
  generated_content?: string
  music?: string
  age?: number
}
