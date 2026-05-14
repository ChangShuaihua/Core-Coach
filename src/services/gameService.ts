import type { Game } from '@/data/mock/games'
import { mockGames, mockGamesDetail } from '@/data/mock/games'

const BASE_URL = '/api'

const useMock = true

export async function getFavoriteGames(): Promise<Game[]> {
  if (useMock) {
    return Promise.resolve(mockGames)
  }

  const response = await fetch(`${BASE_URL}/favorite-games`)
  return response.json()
}

export async function getGameDetail(id: number): Promise<Game | undefined> {
  if (useMock) {
    return Promise.resolve(mockGamesDetail[id])
  }

  const response = await fetch(`${BASE_URL}/games/${id}`)
  return response.json()
}

export async function removeFavoriteGame(id: number): Promise<void> {
  if (useMock) {
    return Promise.resolve()
  }

  await fetch(`${BASE_URL}/favorite-games/${id}`, {
    method: 'DELETE',
  })
}
