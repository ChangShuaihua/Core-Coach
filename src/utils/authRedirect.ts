import Taro from '@tarojs/taro'
import { safeReLaunch } from './route'

const AUTH_RETURN_URL_KEY = 'auth-return-url'

const ALLOWED_RETURN_PREFIXES = [
  '/pages/result/index',
  '/pages/detail/index',
  '/pages/more/index',
  '/pages/favorite-games/index',
  '/pages/account-settings/index',
]

function isSafeReturnUrl(url?: unknown): url is string {
  return (
    typeof url === 'string' &&
    url.startsWith('/') &&
    ALLOWED_RETURN_PREFIXES.some((prefix) => url.startsWith(prefix))
  )
}

export function saveAuthReturnUrl(url: string) {
  if (isSafeReturnUrl(url)) {
    Taro.setStorageSync(AUTH_RETURN_URL_KEY, url)
  }
}

export function consumeAuthReturnUrl(): string {
  const url = Taro.getStorageSync(AUTH_RETURN_URL_KEY)
  Taro.removeStorageSync(AUTH_RETURN_URL_KEY)
  return isSafeReturnUrl(url) ? url : ''
}

export function clearAuthReturnUrl() {
  Taro.removeStorageSync(AUTH_RETURN_URL_KEY)
}

export function redirectToLogin(returnUrl: string) {
  saveAuthReturnUrl(returnUrl)
  return safeReLaunch({ url: '/pages/login/index', source: 'auth.redirectToLogin' })
}
