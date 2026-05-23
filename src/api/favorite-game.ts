import type { Game } from '@/data/mock/games'
import { mockGames } from '@/data/mock/games'
import { get, del } from '@/services/http'

const useMock = false

export async function getFavoriteGames(): Promise<Game[]> {
  if (useMock) {
    return Promise.resolve(mockGames)
  }

  const result = await get<{ total: number; list: Game[] }>('/game/favorite/list')
  return result.data.list
}

export async function getGameDetail(id: number): Promise<Game | undefined> {
  if (useMock) {
    return Promise.resolve(mockGames.find((g) => g.id === id))
  }

  const result = await get<Game>(`/game/favorite/detail?id=${id}`)
  return result.data
}

export async function removeFavoriteGame(id: number): Promise<void> {
  if (useMock) {
    return Promise.resolve()
  }

  await del(`/game/favorite/${id}`)
}
