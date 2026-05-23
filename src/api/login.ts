import Taro from '@tarojs/taro'
import { USE_MOCK } from '@/config/mock'
import { post } from '@/services/http'
import type { LoginData, LoginParams, LoginResult, RefreshData } from '@/types/login'

// 模拟延迟
const mockDelay = (ms = 800) => new Promise((r) => setTimeout(r, ms))

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

// 统一登录接口
export async function login(params: LoginParams): Promise<LoginResult> {
  if (!USE_MOCK) {
    await mockDelay()
    return {
      accessToken: 'mock-token-' + params.login_type + '-' + Date.now(),
      refreshToken: 'mock-refresh-' + params.login_type + '-' + Date.now(),
      accessExpire: 7200,
      refreshExpire: 604800,
      userInfo: {
        id: params.login_type === 'wechat' ? 1 : 2,
        uid: params.login_type === 'wechat' ? '10086' : '10010',
        nickname: params.login_type === 'wechat' ? '微信用户' : '测试账号',
        avatar: '',
      },
    }
  }

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
      refreshtoken: refreshTokenStr,
    },
    { withToken: false }
  )
  return res.data
}
