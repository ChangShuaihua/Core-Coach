import { put } from '@/services/http'

export interface UserInfo {
  nickname: string
  avatar: string
}

export interface UpdateUserInfoResponse {
  nickname: string
  avatar: string
}

export interface UploadAvatarResponse {
  url: string
}

const useMock = false

export async function updateUserInfo(
  nickname: string,
  avatar?: string
): Promise<UpdateUserInfoResponse> {
  if (useMock) {
    return Promise.resolve({
      nickname,
      avatar: avatar || '',
    })
  }

  const requestData: Record<string, any> = { nickname }
  if (avatar) {
    requestData.AvatarURL = avatar
  }
  const result = await put<UpdateUserInfoResponse>('/app/user/profile', requestData)

  if (!result.data) {
    throw new Error((result as any).message || (result as any).msg || '修改个人信息失败')
  }

  return result.data
}

export async function uploadAvatar(filePath: string): Promise<UploadAvatarResponse> {
  if (useMock) {
    return Promise.resolve({
      url: filePath,
    })
  }

  const result = await put<UploadAvatarResponse>('/upload/avatar', { filePath })

  if (!result.data) {
    throw new Error((result as any).message || (result as any).msg || '上传头像失败')
  }

  return result.data
}
