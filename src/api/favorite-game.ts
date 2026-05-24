import { get, del } from '@/services/http'
import type { Game } from '@/types/game'

export async function getFavoriteGames(): Promise<Game[]> {
  const result = await get<{ total: number; list: Game[] }>('/game/favorite/list')
  return result.data.list
}

export async function getGameDetail(id: number): Promise<Game | undefined> {
  const result = await get<Game>(`/game/favorite/detail?id=${id}`)
  return result.data
}

export async function removeFavoriteGame(id: number): Promise<void> {
  await del(`/game/favorite/${id}`)
}
