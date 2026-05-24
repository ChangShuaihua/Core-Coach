import Taro from '@tarojs/taro'
import { post } from '@/services/http'
import type { LoginData, LoginParams, LoginResult, RefreshData } from '@/types/login'

function mapLoginData(data: LoginData): LoginResult {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessExpire: data.accessExpire,
    refreshExpire: data.refreshExpire,
    userInfo: {
      id: data.user.account,
      uid: data.user.account,
      nickname: data.user.nickName,
      avatar: data.user.avatarUrl,
    },
  }
}

export async function login(params: LoginParams): Promise<LoginResult> {
  Taro.showToast({ title: '登录中', icon: 'loading', duration: 1000000 })

  const res = await post<LoginData>(
    '/app/auth/login',
    {
      login_type: params.login_type,
      code: params.code,
      account: params.account,
      password: params.password,
    },
    { withToken: false }
  )

  Taro.hideToast()

  // 后端可能不返回 data（如登录人数满载），需要检查
  if (!res.data) {
    throw new Error(res.message || '登录失败')
  }

  return mapLoginData(res.data)
}

// 刷新 accessToken
export async function refreshToken(refreshTokenStr: string): Promise<RefreshData> {
  const res = await post<RefreshData>(
    '/app/auth/refresh',
    {
      refresh_token: refreshTokenStr,
    },
    { withToken: false }
  )
  return res.data
}

// 登出
export async function logout(): Promise<void> {
  await post('/app/auth/logout')
}
