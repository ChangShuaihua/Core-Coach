import { put, get, post, del } from '@/services/http'
import type { Game } from '@/types/game'

// ============ 账号设置 ============

interface UpdatePasswordParams {
  account: string | number
  password: string
}

interface UpdatePasswordResult {
  account: string
  password: string
}

export async function updatePassword(params: UpdatePasswordParams): Promise<UpdatePasswordResult> {
  const res = await put<UpdatePasswordResult>('/app/user/password', params)
  return res.data
}

export async function getEncryptedPassword(publicKeyPem: string): Promise<string> {
  const res = await post<{ cipherText: string }>('/app/user/info', { publicKey: publicKeyPem })
  return res.data.cipherText
}

// ============ 收藏游戏 ============

export interface FavoriteGamesResult {
  total: number
  page: number
  page_size: number
  list: Game[]
}

export async function getFavoriteGames(
  page: number = 1,
  pageSize: number = 10
): Promise<FavoriteGamesResult> {
  const result = await get<FavoriteGamesResult>(
    `/game/favorite/list?page=${page}&page_size=${pageSize}`
  )
  return result.data
}

export async function getGameDetail(id: number): Promise<Game | undefined> {
  const result = await get<Game>(`/game/favorite/detail?id=${id}`)
  return result.data
}

export interface CollectResult {
  record_id: number
  is_like: number
  message: string
}

export async function collectGame(recordId: number): Promise<CollectResult> {
  const res = await post<CollectResult>('/game/favorite', { record_id: recordId })
  return res.data
}

export async function removeFavoriteGame(id: number): Promise<void> {
  await del(`/game/favorite?id=${id}`)
}
