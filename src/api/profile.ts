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

export async function getFavoriteGames(): Promise<Game[]> {
  const result = await get<{ total: number; list: Game[] }>('/game/favorite/list')
  return result.data.list
}

export async function getGameDetail(id: number): Promise<Game | undefined> {
  const result = await get<Game>(`/game/favorite/detail?id=${id}`)
  return result.data
}

export async function collectGame(recordId: number): Promise<void> {
  await post('/game/favorite', { record_id: recordId })
}

export async function removeFavoriteGame(id: number): Promise<void> {
  await del(`/game/favorite?id=${id}`)
}
