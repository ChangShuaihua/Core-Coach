import Taro from '@tarojs/taro'
import { put, getStoredState } from '@/services/http'

export interface UserInfo {
  nickname: string
  avatar: string
}

export interface UpdateUserInfoResponse {
  nickname: string
  avatar: string
}

export interface UploadAvatarResponse {
  file_url: string
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
      file_url: filePath,
    })
  }

  const BASE_URL = process.env.TARO_APP_API_URL || 'http://192.168.10.7:8083/api/v1'
  const { accessToken } = getStoredState()

  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE_URL}/upload`,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${accessToken}`,
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0 && data.data) {
            resolve({ file_url: data.data.file_url })
          } else {
            reject(new Error(data.message || '上传头像失败'))
          }
        } catch {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传头像失败'))
      },
    })
  })
}
