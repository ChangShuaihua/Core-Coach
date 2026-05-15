import Taro from '@tarojs/taro'
import { USE_MOCK } from '@/config/mock'
import type { UserInfo } from '@/pages/profile/types'
import { post } from '@/services/http'

interface LoginResponse {
  token: string
  userInfo: UserInfo
}

// 模拟延迟
const mockDelay = (ms = 800) => new Promise((r) => setTimeout(r, ms))

// 微信登录
export async function wechatLogin(): Promise<LoginResponse> {
  if (USE_MOCK) {
    await mockDelay()
    return {
      token: 'mock-token-wechat-' + Date.now(),
      userInfo: { id: 1, uid: '10086', nickname: '微信用户', avatar: '' },
    }
  }

  const { code } = await Taro.login()
  return post<LoginResponse>('/auth/wechat-login', { code }, { withToken: false })
}

// 账号密码登录
export async function accountLogin(phone: string, password: string): Promise<LoginResponse> {
  if (USE_MOCK) {
    await mockDelay()
    return {
      token: 'mock-token-account-' + Date.now(),
      userInfo: { id: 2, uid: '10010', nickname: '测试账号', avatar: '' },
    }
  }

  return post<LoginResponse>('/auth/login', { phone, password }, { withToken: false })
}
