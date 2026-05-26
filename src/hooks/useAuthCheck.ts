import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'

/**
 * 页面登录守卫：token 为空时跳转登录页
 * 不做 token 刷新（刷新逻辑在 http.ts 的 refreshTokenIfNeeded 中）
 */
export function useAuthCheck() {
  const accessToken = useUserStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken) {
      const pages = Taro.getCurrentPages()
      const currentRoute = pages[pages.length - 1]?.route || ''
      if (currentRoute !== 'pages/login/index') {
        Taro.redirectTo({ url: '/pages/login/index' })
      }
    }
  }, [accessToken])
}
