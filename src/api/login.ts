import { USE_MOCK } from '@/config/mock'
import { post } from '@/services/http'
import type { LoginData, LoginParams, LoginResult } from '@/types/login'

// 模拟延迟
const mockDelay = (ms = 800) => new Promise((r) => setTimeout(r, ms))

function mapLoginData(data: LoginData): LoginResult {
  return {
    accessToken: data.access_token,
    userInfo: {
      id: data.user.user_id,
      uid: data.user.open_id,
      nickname: data.user.nick_name,
      avatar: data.user.avatar_url,
    },
  }
}

// 统一登录接口
export async function login(params: LoginParams): Promise<LoginResult> {
  if (USE_MOCK) {
    await mockDelay()
    return {
      accessToken: 'mock-token-' + params.login_type + '-' + Date.now(),
      userInfo: {
        id: params.login_type === 'wechat' ? 1 : 2,
        uid: params.login_type === 'wechat' ? '10086' : '10010',
        nickname: params.login_type === 'wechat' ? '微信用户' : '测试账号',
        avatar: '',
      },
    }
  }

  const data = await post<LoginData>(
    '/v1/app/auth/login',
    {
      login_type: params.login_type,
      code: params.code,
      account: params.account,
      password: params.password,
    },
    { withToken: false }
  )
  return mapLoginData(data)
}

// 刷新 accessToken
export async function refreshToken(accessToken: string): Promise<string> {
  const data = await post<{ accessToken: string }>('/v1/app/auth/refresh', undefined, {
    withToken: false,
    showLoading: false,
    header: { Authorization: `Bearer ${accessToken}` },
  })
  return data.accessToken
}
