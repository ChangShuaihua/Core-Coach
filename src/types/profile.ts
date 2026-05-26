import type { ReactNode } from 'react'

// 用户信息类型
export interface UserInfo {
  account: string | number
  nickname: string
  avatar?: string
  password?: string
}

// 菜单项类型
export interface MenuItem {
  id: string
  title: string
  icon: ReactNode
  iconColor?: string
  path?: string
  onClick?: () => void
}

// 菜单分组类型
export interface MenuGroup {
  id: string
  items: MenuItem[]
}
