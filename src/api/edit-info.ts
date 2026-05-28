import { put, post } from '@/services/http'

export interface UserInfo {
  nickName: string
  avatarUrl: string
}

export async function getUserInfo(): Promise<UserInfo> {
  const res = await put<UserInfo>('/user/info')
  return res.data
}

export async function updateUserInfo(nickName: string, avatarUrl?: string): Promise<void> {
  await put('/app/user/profile', { nickName, avatarUrl })
}

export async function uploadAvatar(filePath: string): Promise<string> {
  const res = await post<{ url: string }>('/upload', { filePath })
  return res.data.url
}
