import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserInfo } from '@/pages/profile/types'

interface UserState {
  token: string
  userInfo: UserInfo | null
  setToken: (token: string) => void
  setUserInfo: (userInfo: UserInfo) => void
  clearToken: () => void
}

const taroStorage = createJSONStorage<UserState>(() => ({
  getItem: (name) => Taro.getStorageSync(name) || null,
  setItem: (name, value) => Taro.setStorageSync(name, value),
  removeItem: (name) => Taro.removeStorageSync(name),
}))

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: '',
      userInfo: null,
      setToken: (token) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      clearToken: () => set({ token: '', userInfo: null }),
    }),
    {
      name: 'user-storage',
      storage: taroStorage,
      partialize: (state) => ({ token: state.token }),
    }
  )
)
