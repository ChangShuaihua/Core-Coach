import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ws } from '@/services/ws'
import type { UserInfo } from '@/types/profile'
import { clearSkillStorage } from './chatStore'

interface UserState {
  accessToken: string
  refreshToken: string
  accessExpireTime: number
  refreshExpireTime: number
  userInfo: UserInfo | null
  setAccessToken: (accessToken: string) => void
  setRefreshToken: (refreshToken: string) => void
  setAccessExpireTime: (accessExpire: number) => void
  setRefreshExpireTime: (refreshExpire: number) => void
  setUserInfo: (userInfo: UserInfo) => void
  clearAuth: () => void
}

const taroStorage = {
  getItem: (name: string) => {
    try {
      const data = Taro.getStorageSync(name)
      if (!data) return null
      return typeof data === 'string' ? data : JSON.stringify(data)
    } catch (e) {
      return null
    }
  },
  setItem: (name: string, value: unknown) => {
    try {
      // Zustand 传入的 value 已经是 JSON 字符串，直接存储
      const data = typeof value === 'string' ? value : JSON.stringify(value)
      Taro.setStorageSync(name, data)
    } catch {
      console.error('Failed to set storage:', name)
    }
  },
  removeItem: (name: string) => {
    try {
      Taro.removeStorageSync(name)
    } catch {
      console.error('Failed to remove storage:', name)
    }
  },
} as any

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      accessToken: '',
      refreshToken: '',
      accessExpireTime: 0,
      refreshExpireTime: 0,
      userInfo: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setAccessExpireTime: (accessExpire) =>
        set({ accessExpireTime: Date.now() + accessExpire * 1000 }),
      setRefreshExpireTime: (refreshExpire) =>
        set({ refreshExpireTime: Date.now() + refreshExpire * 1000 }),
      setUserInfo: (userInfo) => set({ userInfo }),
      clearAuth: () => {
        ws.disconnect()
        clearSkillStorage()
        set({
          accessToken: '',
          refreshToken: '',
          accessExpireTime: 0,
          refreshExpireTime: 0,
          userInfo: null,
        })
      },
    }),
    {
      name: 'user-storage',
      storage: taroStorage,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessExpireTime: state.accessExpireTime,
        refreshExpireTime: state.refreshExpireTime,
        userInfo: state.userInfo,
      }),
    }
  )
)

// 手动水合：直接从 Taro storage 读取并写入 store
// 绕过 persist 中间件的 onRehydrateStorage（在小程序环境下不可靠）
function manualHydrate() {
  try {
    const raw = Taro.getStorageSync('user-storage')
    if (!raw) return
    const str = typeof raw === 'string' ? raw : JSON.stringify(raw)
    const parsed = JSON.parse(str)
    const storedState = parsed?.state
    if (storedState?.accessToken) {
      useUserStore.setState({
        accessToken: storedState.accessToken,
        refreshToken: storedState.refreshToken,
        accessExpireTime: storedState.accessExpireTime,
        refreshExpireTime: storedState.refreshExpireTime,
        userInfo: storedState.userInfo,
      })
    }
  } catch (e) {
    console.warn('[Storage] 手动水合失败:', e)
  }
}

// 立即执行水合
manualHydrate()

// 水合完成的 Promise（已同步完成）
export const waitForHydration = Promise.resolve()
