import Taro from '@tarojs/taro'
import { put } from '@/services/http'
import { useUserStore } from '@/store/useUserStore'

export interface UserInfo {
  nickName: string
  avatarUrl: string
}

const BASE_URL = process.env.TARO_APP_API_URL || 'http://192.168.10.7:8083/api/v1'

export async function getUserInfo(): Promise<UserInfo> {
  const res = await put<UserInfo>('/user/info')
  return res.data
}

export async function updateUserInfo(nickName: string, avatarUrl?: string): Promise<void> {
  await put('/app/user/profile', { nickName, avatarUrl })
}

export async function uploadAvatar(filePath: string): Promise<string> {
  const token = useUserStore.getState().accessToken

  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE_URL}/upload`,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data.file_url)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}
