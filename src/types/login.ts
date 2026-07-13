import type { UserInfo } from './profile'

export interface LoginData {
  accessToken: string
  refreshToken: string
  accessExpire: number
  refreshExpire: number
  user: {
    account: string
    nickName: string
    avatarUrl: string
    password: string
    createdAt: string
    updatedAt: string
  }
}

export interface RefreshData {
  accessToken: string
  refreshToken: string
  accessExpire: number
  refreshExpire: number
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  accessExpire: number
  refreshExpire: number
  userInfo: UserInfo
}

export interface LoginParams {
  login_type: 'wechat' | 'account'
  code: string
  account: string
  password: string
}
