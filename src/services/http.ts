import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { safeReLaunch } from '@/utils/route'

const BASE_URL = process.env.TARO_APP_API_URL || ''
if (!BASE_URL) {
  console.warn('[HTTP] TARO_APP_API_URL 未配置，请检查 .env 文件')
}
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
  // 是否为内部刷新重放调用，跳过 401 刷新逻辑
  _isRefreshRetry?: boolean
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

export type TokenRefreshStatus = 'ok' | 'missing-auth' | 'refresh-expired' | 'temporary-failed'

export interface TokenRefreshCheckResult {
  ok: boolean
  status: TokenRefreshStatus
  token?: string
  error?: unknown
}

function isBusinessSuccess(response: ApiResponse<any>): boolean {
  return response.code === 0 || response.code === 200
}

function log(...args: any[]) {
  if (isDev) {
    console.log('[HTTP]', ...args)
  }
}

// ============ Token 刷新机制 ============

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function resolvePendingQueue(token: string) {
  pendingQueue.forEach(({ resolve }) => resolve(token))
  pendingQueue = []
}

function rejectPendingQueue(error: unknown) {
  pendingQueue.forEach(({ reject }) => reject(error))
  pendingQueue = []
}

// 提前 2 分钟视为即将过期
const REFRESH_ADVANCE_MS = 2 * 60 * 1000

// 从 storage 实时读取存储的状态（绕过 store 水合问题）
export function getStoredState(): {
  accessToken: string
  refreshToken: string
  accessExpireTime: number
  refreshExpireTime: number
  userInfo: { account: string; nickname: string; avatar: string } | null
} {
  try {
    const raw = Taro.getStorageSync('user-storage')
    if (!raw) {
      return {
        accessToken: '',
        refreshToken: '',
        accessExpireTime: 0,
        refreshExpireTime: 0,
        userInfo: null,
      }
    }
    const str = typeof raw === 'string' ? raw : JSON.stringify(raw)
    const parsed = JSON.parse(str)
    const s = parsed?.state || {}
    return {
      accessToken: s.accessToken || '',
      refreshToken: s.refreshToken || '',
      accessExpireTime: s.accessExpireTime || 0,
      refreshExpireTime: s.refreshExpireTime || 0,
      userInfo: s.userInfo || null,
    }
  } catch {
    return {
      accessToken: '',
      refreshToken: '',
      accessExpireTime: 0,
      refreshExpireTime: 0,
      userInfo: null,
    }
  }
}

function isTokenExpiringSoon(): boolean {
  const { accessExpireTime, accessToken } = getStoredState()
  if (!accessToken || !accessExpireTime) return false
  return Date.now() + REFRESH_ADVANCE_MS >= accessExpireTime
}

export function isRefreshTokenExpired(): boolean {
  const { refreshToken, refreshExpireTime } = getStoredState()
  if (!refreshToken || !refreshExpireTime) return true
  return Date.now() >= refreshExpireTime
}

function isAuthExpiredError(err: any): boolean {
  if (isRefreshTokenExpired()) return true
  const statusCode = Number(err?.statusCode ?? err?.status)
  const code = Number(err?.code)
  return statusCode === 401 || code === 401
}

// 统一登出 + 跳转登录页（防重复执行）
let isLoggingOut = false
export function isLogoutRedirecting() {
  return isLoggingOut
}

export function logoutAndRedirect(message = '登录已失效，请重新登录') {
  if (isLoggingOut) return
  isLoggingOut = true
  useUserStore.getState().clearAuth()
  Taro.showToast({ title: message, icon: 'none' })
  setTimeout(() => {
    safeReLaunch({ url: '/pages/login/index', source: 'http.logoutAndRedirect' })
    isLoggingOut = false
  }, 1000)
}

async function doRefreshToken(): Promise<string> {
  const { refreshToken: refreshTokenStr, refreshExpireTime } = getStoredState()
  if (!refreshExpireTime || Date.now() >= refreshExpireTime) {
    throw Object.assign(new Error('refreshToken expired'), { code: 401 })
  }
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

export async function forceRefreshToken(): Promise<string> {
  return refreshTokenWithLock()
}

async function refreshTokenWithLock(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingQueue.push({
        resolve,
        reject,
      })
    })
  }

  isRefreshing = true
  try {
    const newToken = await doRefreshToken()
    resolvePendingQueue(newToken)
    return newToken
  } catch (err) {
    rejectPendingQueue(err)
    if (isAuthExpiredError(err)) {
      log('[Refresh] auth expired, logout')
      logoutAndRedirect()
    } else {
      log('[Refresh] refresh failed, keep local auth for retry', err)
    }
    throw err
  } finally {
    isRefreshing = false
  }
}

// 主动刷新（请求前检查到即将过期时调用）
async function ensureTokenValid(): Promise<string | null> {
  if (!isTokenExpiringSoon()) {
    return getStoredState().accessToken
  }
  return refreshTokenWithLock()
}

/**
 * 应用级 token 刷新（用于 useDidShow 等场景）
 * 复用内部 ensureTokenValid，全局锁只有一套
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  const result = await checkAndRefreshToken()
  return result.ok
}

export async function checkAndRefreshToken(): Promise<TokenRefreshCheckResult> {
  const { accessToken, refreshToken } = getStoredState()
  if (!accessToken || !refreshToken) {
    return { ok: false, status: 'missing-auth' }
  }
  if (isRefreshTokenExpired()) {
    return { ok: false, status: 'refresh-expired' }
  }
  try {
    const token = await ensureTokenValid()
    if (!token) return { ok: false, status: 'missing-auth' }
    return { ok: true, status: 'ok', token }
  } catch (error) {
    return {
      ok: false,
      status: isAuthExpiredError(error) ? 'refresh-expired' : 'temporary-failed',
      error,
    }
  }
}

// 被动刷新（401 触发）— 接受重试回调，request 和 upload 共用
async function handleTokenRefresh(retryFn: (newToken: string) => Promise<any>): Promise<any> {
  try {
    const newToken = await refreshTokenWithLock()
    return retryFn(newToken)
  } catch {
    return Promise.reject(new Error('token refresh failed'))
  }
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
        return Promise.reject({ ...body, statusCode })
      }
      // 刷新重试的请求也 401，直接登出
      if (_isRefreshRetry) {
        logoutAndRedirect()
        return Promise.reject(new Error('未授权'))
      }
      // 尝试刷新 token
      return handleTokenRefresh((newToken) => {
        const retryHeader = { ...options.header, Authorization: `Bearer ${newToken}` }
        return requestBase({
          ...options,
          header: retryHeader,
          withToken: false,
          _isRefreshRetry: true,
        })
      })
    }

    if (statusCode >= 200 && statusCode < 300 && isBusinessSuccess(body)) {
      return body
    }

    return Promise.reject({ ...body, statusCode })
  } catch (err: any) {
    log(`[${method}] ${url} - Error:`, err.message)

    if (retryCount > 0) {
      const retriedTimes = MAX_RETRY_COUNT - retryCount + 1
      log(`[Retry] ${url} - 第 ${retriedTimes} 次重试`)
      return requestBase<T>({ ...options, retryCount: retryCount - 1 })
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

export async function upload<T = any>(
  url: string,
  filePath: string,
  name: string = 'file'
): Promise<ApiResponse<T>> {
  const token = await ensureTokenValid()
  if (!token) {
    return Promise.reject(new Error('token 为空！'))
  }

  const header = { Authorization: `Bearer ${token}` }

  const requestStartTime = Date.now()
  log(`[UPLOAD] ${url}`, { filePath, name })

  const doUpload = (hdr: Record<string, string>, isRefreshRetry = false): Promise<ApiResponse<T>> =>
    new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: `${BASE_URL}${url}`,
        filePath,
        name,
        header: hdr,
        success: (res) => {
          const duration = Date.now() - requestStartTime
          log(`[UPLOAD] ${url} - ${res.statusCode} (${duration}ms)`)

          if (res.statusCode === 401) {
            if (isRefreshRetry) {
              logoutAndRedirect()
              reject(new Error('未授权'))
              return
            }
            handleTokenRefresh((newToken) => {
              const newHeader = { ...hdr, Authorization: `Bearer ${newToken}` }
              return doUpload(newHeader, true)
            })
              .then(resolve)
              .catch(reject)
            return
          }

          try {
            const data = JSON.parse(res.data as string) as ApiResponse<T>
            if (res.statusCode >= 200 && res.statusCode < 300 && isBusinessSuccess(data)) {
              resolve(data)
              return
            }
            reject(data)
          } catch {
            reject(new Error('解析响应失败'))
          }
        },
        fail: (err) => {
          log(`[UPLOAD] ${url} - Error:`, err.errMsg)
          reject(new Error(err.errMsg || '上传失败'))
        },
      })
    })

  return doUpload(header)
}
