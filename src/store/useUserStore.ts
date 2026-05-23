import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserInfo } from '@/types/profile'

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

const taroStorage = createJSONStorage<UserState>(() => ({
  getItem: (name) => Taro.getStorageSync(name) || null,
  setItem: (name, value) => Taro.setStorageSync(name, value),
  removeItem: (name) => Taro.removeStorageSync(name),
})) as any

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
      clearAuth: () =>
        set({
          accessToken: '',
          refreshToken: '',
          accessExpireTime: 0,
          refreshExpireTime: 0,
          userInfo: null,
        }),
    }),
    {
      name: 'user-storage',
      storage: taroStorage,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessExpireTime: state.accessExpireTime,
        refreshExpireTime: state.refreshExpireTime,
      }),
    }
  )
)
