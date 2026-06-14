import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { isLogoutRedirecting } from '@/services/http'
import { useUserStore } from '@/store/useUserStore'
import { safeReLaunch } from '@/utils/route'

/**
 * 页面登录守卫：token 为空时跳转登录页
 * 不做 token 刷新（刷新逻辑在 http.ts 的 refreshTokenIfNeeded 中）
 */
export function useAuthCheck() {
  const accessToken = useUserStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken && !isLogoutRedirecting()) {
      const pages = Taro.getCurrentPages()
      const currentRoute = pages[pages.length - 1]?.route || ''
      if (currentRoute !== 'pages/login/index') {
        safeReLaunch({ url: '/pages/login/index', source: 'useAuthCheck' })
      }
    }
  }, [accessToken])
}
