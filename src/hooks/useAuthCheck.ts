import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { refreshToken } from '@/api/login'
import { useUserStore } from '@/store/useUserStore'

/**
 * 检查登录状态，自动刷新 token，token 失效时跳转登录页
 * 返回 isChecking 表示是否正在检查中
 */
export function useAuthCheck() {
  const [isChecking, setIsChecking] = useState(true)
  const accessToken = useUserStore((state) => state.accessToken)

  useEffect(() => {
    checkAuth()
  }, [])

  // 监听 accessToken 变化，为空时跳转登录页
  useEffect(() => {
    if (!isChecking && !accessToken) {
      const pages = Taro.getCurrentPages()
      const currentRoute = pages[pages.length - 1]?.route || ''
      if (currentRoute !== 'pages/login/index') {
        Taro.redirectTo({ url: '/pages/login/index' })
      }
    }
  }, [accessToken, isChecking])

  const checkAuth = async () => {
    const {
      refreshToken: refreshTokenStr,
      refreshExpireTime,
      accessToken: currentToken,
      accessExpireTime,
    } = useUserStore.getState()

    // 没有 refreshToken 或已过期，需要重新登录
    if (!refreshTokenStr || !refreshExpireTime || Date.now() >= refreshExpireTime) {
      if (refreshTokenStr) {
        useUserStore.getState().clearAuth()
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
      }
      setIsChecking(false)
      return
    }

    // accessToken 还没过期，直接使用
    const REFRESH_ADVANCE_MS = 2 * 60 * 1000
    if (currentToken && accessExpireTime > Date.now() + REFRESH_ADVANCE_MS) {
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
      useUserStore.getState().clearAuth()
      Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
    }

    setIsChecking(false)
  }

  return { isChecking }
}
