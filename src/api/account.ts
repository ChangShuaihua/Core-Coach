import { put } from '@/services/http'

export interface AccountInfo {
  account: string
  password: string
}

export interface UpdatePasswordResponse {
  account: string
  password: string
}

const useMock = false

export async function updatePassword(newPassword: string): Promise<UpdatePasswordResponse> {
  if (useMock) {
    return Promise.resolve({
      account: '10086',
      password: newPassword,
    })
  }

  const result = await put<UpdatePasswordResponse>('/app/user/password', {
    password: newPassword,
    confirmPassword: newPassword,
  })

  if (!result.data) {
    throw new Error((result as any).message || (result as any).msg || '修改密码失败')
  }

  return result.data
}
