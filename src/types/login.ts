import type { UserInfo } from './profile'

export interface LoginData {
  access_token: string
  expire_at: string
  user: {
    user_id: number
    open_id: string
    nick_name: string
    avatar_url: string
    tag_id: number
    status: number
    max_login_count: number
    last_login_time: string
    created_at: string
    updated_at: string
  }
}

export interface LoginResult {
  accessToken: string
  userInfo: UserInfo
}

export interface LoginParams {
  login_type: 'wechat' | 'password'
  code: string
  account: string
  password: string
}
