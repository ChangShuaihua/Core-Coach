import { mockGames } from '@/data/mock/games'
import { get, del } from '@/services/http'
import type { favoriteGame } from '@/types/game'

const useMock = false

export async function getFavoriteGames(): Promise<favoriteGame[]> {
  if (useMock) {
    return Promise.resolve(mockGames as unknown as favoriteGame[])
  }

  const result = await get<{ total: number; list: favoriteGame[] }>('/game/favorite/list')
  return result.data.list
}

export async function getGameDetail(id: number): Promise<favoriteGame | undefined> {
  if (useMock) {
    return Promise.resolve(mockGames.find((g) => g.id === id) as unknown as favoriteGame)
  }

  const result = await get<favoriteGame>(`/game/favorite/detail?id=${id}`)
  return result.data
}

export async function removeFavoriteGame(id: number): Promise<void> {
  if (useMock) {
    return Promise.resolve()
  }

  await del(`/game/favorite/${id}`)
}
