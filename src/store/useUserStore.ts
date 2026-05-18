import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserInfo } from '@/types/profile'

interface UserState {
  accessToken: string
  userInfo: UserInfo | null
  setAccessToken: (accessToken: string) => void
  setUserInfo: (userInfo: UserInfo) => void
  clearAuth: () => void
}

const taroStorage = createJSONStorage<UserState>(() => ({
  getItem: (name) => Taro.getStorageSync(name) || null,
  setItem: (name, value) => Taro.setStorageSync(name, value),
  removeItem: (name) => Taro.removeStorageSync(name),
}))

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      accessToken: '',
      userInfo: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      setUserInfo: (userInfo) => set({ userInfo }),
      clearAuth: () => set({ accessToken: '', userInfo: null }),
    }),
    {
      name: 'user-storage',
      storage: taroStorage,
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
)
