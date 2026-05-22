import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { refreshToken } from '@/api/login'
import { useUserStore } from '@/store/useUserStore'

/**
 * 检查登录状态，自动刷新 token
 * 返回 isChecking 表示是否正在检查中
 */
export function useAuthCheck() {
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      refreshToken: refreshTokenStr,
      refreshExpireTime,
      accessToken,
    } = useUserStore.getState()

    // 没有 refreshToken 或已过期，需要重新登录
    if (!refreshTokenStr || !refreshExpireTime || Date.now() >= refreshExpireTime) {
      if (refreshTokenStr) {
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
      }
      setIsChecking(false)
      return
    }

    // accessToken 还没过期，直接使用
    if (accessToken && useUserStore.getState().accessExpireTime > Date.now()) {
      setIsChecking(false)
      return
    }

    // refreshToken 有效但 accessToken 过期，自动刷新
    try {
      const result = await refreshToken(refreshTokenStr)
      useUserStore.getState().setAccessToken(result.accessToken)
      useUserStore.getState().setRefreshToken(result.refreshToken)
      useUserStore.getState().setAccessExpireTime(result.accessExpire)
      useUserStore.getState().setRefreshExpireTime(result.refreshExpire)
    } catch {
      // 刷新失败，清除登录状态
      useUserStore.getState().clearAuth()
      Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
    }

    setIsChecking(false)
  }

  return { isChecking }
}
