import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'

const BASE_URL = process.env.TARO_APP_API_URL || 'http://47.95.112.67:8083/api/v1'
const REQUEST_TIMEOUT = 10000
const MAX_RETRY_COUNT = 2

const isDev = process.env.NODE_ENV === 'development'

interface RequestOptions {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, any>
  header?: Record<string, string>
  // 是否需要携带 token，默认 true
  withToken?: boolean
  // 失败重试次数，默认 0（不重试）
  retryCount?: number
  // 是否为内部重试调用
  _isRetry?: boolean
  // 是否为内部刷新重放调用，跳过 401 刷新逻辑
  _isRefreshRetry?: boolean
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

function log(...args: any[]) {
  if (isDev) {
    console.log('[HTTP]', ...args)
  }
}

// ============ Token 刷新机制 ============

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

// 提前 2 分钟视为即将过期
const REFRESH_ADVANCE_MS = 2 * 60 * 1000

// 从 storage 实时读取存储的状态（绕过 store 水合问题）
export function getStoredState(): {
  accessToken: string
  refreshToken: string
  accessExpireTime: number
  userInfo: { account: string; nickname: string; avatar: string } | null
} {
  try {
    const raw = Taro.getStorageSync('user-storage')
    if (!raw) return { accessToken: '', refreshToken: '', accessExpireTime: 0, userInfo: null }
    const str = typeof raw === 'string' ? raw : JSON.stringify(raw)
    const parsed = JSON.parse(str)
    const s = parsed?.state || {}
    return {
      accessToken: s.accessToken || '',
      refreshToken: s.refreshToken || '',
      accessExpireTime: s.accessExpireTime || 0,
      userInfo: s.userInfo || null,
    }
  } catch {
    return { accessToken: '', refreshToken: '', accessExpireTime: 0, userInfo: null }
  }
}

function isTokenExpiringSoon(): boolean {
  const { accessExpireTime, accessToken } = getStoredState()
  if (!accessToken || !accessExpireTime) return false
  return Date.now() + REFRESH_ADVANCE_MS >= accessExpireTime
}

// 统一登出 + 跳转登录页（防重复执行）
let isLoggingOut = false
export function logoutAndRedirect() {
  if (isLoggingOut) return
  isLoggingOut = true
  useUserStore.getState().clearAuth()
  Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
  setTimeout(() => {
    Taro.reLaunch({ url: '/pages/login/index' })
    isLoggingOut = false
  }, 1500)
}

async function doRefreshToken(): Promise<string> {
  const refreshTokenStr = getStoredState().refreshToken
  if (!refreshTokenStr) throw new Error('refreshToken 不存在')
  log('[Refresh] 开始刷新 token')
  const { refreshToken: refreshFn } = await import('@/api/login')
  const result = await refreshFn(refreshTokenStr)
  useUserStore.getState().setAccessToken(result.accessToken)
  useUserStore.getState().setRefreshToken(result.refreshToken)
  useUserStore.getState().setAccessExpireTime(result.accessExpire)
  useUserStore.getState().setRefreshExpireTime(result.refreshExpire)
  log('[Refresh] 刷新成功')
  return result.accessToken
}

// 主动刷新（请求前检查到即将过期时调用）
async function ensureTokenValid(): Promise<string | null> {
  if (!isTokenExpiringSoon()) {
    return getStoredState().accessToken
  }

  if (isRefreshing) {
    // 已有刷新进行中，排队等待
    return new Promise((resolve) => {
      pendingQueue.push((newToken) => {
        resolve(newToken)
      })
    })
  }

  isRefreshing = true
  try {
    const newToken = await doRefreshToken()
    pendingQueue.forEach((cb) => cb(newToken))
    pendingQueue = []
    return newToken
  } catch (err) {
    log('[Refresh] 刷新失败，执行登出')
    pendingQueue = []
    logoutAndRedirect()
    return null
  } finally {
    isRefreshing = false
  }
}

/**
 * 应用级 token 刷新（用于 useDidShow 等场景）
 * 复用内部 ensureTokenValid，全局锁只有一套
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  const { accessToken, refreshToken } = getStoredState()
  if (!accessToken || !refreshToken) return false
  const result = await ensureTokenValid()
  return !!result
}

// 被动刷新（401 触发）
async function handleTokenRefresh(failedOptions: RequestOptions): Promise<any> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingQueue.push((newToken) => {
        resolve(executeWithToken(failedOptions, newToken))
      })
    })
  }

  isRefreshing = true
  try {
    const newToken = await doRefreshToken()
    pendingQueue.forEach((cb) => cb(newToken))
    pendingQueue = []
    return executeWithToken(failedOptions, newToken)
  } catch (err) {
    log('[Refresh] 401 刷新失败，执行登出')
    pendingQueue = []
    logoutAndRedirect()
    return Promise.reject(new Error('token 刷新失败'))
  } finally {
    isRefreshing = false
  }
}

function executeWithToken(options: RequestOptions, token: string): Promise<any> {
  const header = { ...options.header, Authorization: `Bearer ${token}` }
  return requestBase({
    ...options,
    header,
    withToken: false,
    _isRefreshRetry: true,
  })
}

// ============ 核心请求函数 ============

async function requestBase<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  const {
    url,
    method,
    data,
    header = {},
    withToken = true,
    retryCount = 0,
    _isRefreshRetry = false,
  } = options

  if (withToken) {
    const token = await ensureTokenValid()
    if (!token) {
      return Promise.reject(new Error('token 为空！'))
    }
    header['Authorization'] = `Bearer ${token}`
  }

  const requestStartTime = Date.now()
  log(`[${method}] ${url}`, { data, header })

  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      timeout: REQUEST_TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
    })

    const duration = Date.now() - requestStartTime
    log(`[${method}] ${url} - ${res.statusCode} (${duration}ms)`, res.data)

    const statusCode = res.statusCode
    const body = res.data as ApiResponse<T>

    if (statusCode === 401) {
      // withToken: false 的请求（如登录、刷新 token）返回 401，直接拒绝，不触发刷新
      if (!withToken) {
        return Promise.reject(body)
      }
      // 刷新重试的请求也 401，直接登出
      if (_isRefreshRetry) {
        logoutAndRedirect()
        return Promise.reject(new Error('未授权'))
      }
      // 尝试刷新 token
      return handleTokenRefresh(options)
    }

    if (statusCode >= 200 && statusCode < 300) {
      return body
    }

    return Promise.reject(body)
  } catch (err: any) {
    log(`[${method}] ${url} - Error:`, err.message)

    if (retryCount > 0) {
      const retriedTimes = MAX_RETRY_COUNT - retryCount + 1
      log(`[Retry] ${url} - 第 ${retriedTimes} 次重试`)
      return requestBase<T>({ ...options, retryCount: retryCount - 1, _isRetry: true })
    }

    if (err.errMsg?.includes('timeout') || err.message?.includes('超时')) {
      Taro.showToast({ title: '请求超时，请稍后重试', icon: 'none' })
    } else {
      Taro.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    }
    return Promise.reject(err)
  }
}

async function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  return requestBase<T>(options)
}

export function get<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Partial<RequestOptions>
) {
  return request<T>({ url, method: 'GET', data, ...options })
}

export function post<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Partial<RequestOptions>
) {
  return request<T>({ url, method: 'POST', data, ...options })
}

export function put<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Partial<RequestOptions>
) {
  return request<T>({ url, method: 'PUT', data, ...options })
}

export function del<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Partial<RequestOptions>
) {
  return request<T>({ url, method: 'DELETE', data, ...options })
}
