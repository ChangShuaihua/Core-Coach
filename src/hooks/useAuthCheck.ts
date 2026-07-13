import { useEffect } from 'react'
import { isLogoutRedirecting } from '@/services/http'
import { useUserStore } from '@/store/useUserStore'
import { redirectToLogin } from '@/utils/authRedirect'

/**
 * 页面登录守卫：token 为空时跳转登录页
 * 不做 token 刷新（刷新逻辑在 http.ts 的 refreshTokenIfNeeded 中）
 */
export function useAuthCheck(returnUrl: string): boolean {
  const accessToken = useUserStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken && !isLogoutRedirecting()) {
      redirectToLogin(returnUrl)
    }
  }, [accessToken, returnUrl])

  return !!accessToken
}
