import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'

const BASE_URL =
  process.env.TARO_APP_API_URL || 'http://127.0.0.1:4523/m1/8210003-7970088-default/api'
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
  // 是否显示 loading，默认 true
  showLoading?: boolean
  // 失败重试次数，默认 0（不重试）
  retryCount?: number
  // 是否为内部重试调用，跳过 loading 展示
  _isRetry?: boolean
  // 是否为内部刷新重放调用，跳过 401 刷新逻辑
  _isRefreshRetry?: boolean
}

interface ApiResponse<T = any> {
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

async function handleTokenRefresh(failedOptions: RequestOptions): Promise<any> {
  if (isRefreshing) {
    // 已有刷新进行中，排队等待新 token
    return new Promise((resolve) => {
      pendingQueue.push((newToken) => {
        resolve(executeWithToken(failedOptions, newToken))
      })
    })
  }

  isRefreshing = true
  const oldToken = useUserStore.getState().accessToken

  try {
    log('[Refresh] 开始刷新 token')
    const { refreshToken } = await import('@/api/login')
    const newToken = await refreshToken(oldToken)
    useUserStore.getState().setAccessToken(newToken)
    log('[Refresh] 刷新成功')

    // 通知队列中等待的请求
    pendingQueue.forEach((cb) => cb(newToken))
    pendingQueue = []

    // 重放当前失败的请求
    return executeWithToken(failedOptions, newToken)
  } catch (err) {
    log('[Refresh] 刷新失败，执行登出')
    pendingQueue = []
    useUserStore.getState().clearAuth()
    Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
    setTimeout(() => {
      Taro.redirectTo({ url: '/pages/login/index' })
    }, 1500)
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
    showLoading: false,
    _isRefreshRetry: true,
  })
}

// ============ 核心请求函数 ============

async function requestBase<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method,
    data,
    header = {},
    withToken = true,
    showLoading = true,
    retryCount = 0,
    _isRetry = false,
    _isRefreshRetry = false,
  } = options

  if (withToken) {
    const token = useUserStore.getState().accessToken
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  const requestStartTime = Date.now()
  const shouldShowLoading = showLoading && !_isRetry

  if (shouldShowLoading) {
    Taro.showLoading({ title: '加载中...', mask: true })
  }

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
      // 刷新请求本身 401 → 直接登出，不递归刷新
      if (_isRefreshRetry) {
        useUserStore.getState().clearAuth()
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/login/index' })
        }, 1500)
        return Promise.reject(new Error('未授权'))
      }
      // 尝试刷新 token
      return handleTokenRefresh(options)
    }

    if (statusCode >= 200 && statusCode < 300) {
      return body.data
    }

    Taro.showToast({ title: body.message || '请求失败', icon: 'none' })
    return Promise.reject(new Error(body.message || '请求失败'))
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
  } finally {
    if (shouldShowLoading) {
      Taro.hideLoading()
    }
  }
}

async function request<T = any>(options: RequestOptions): Promise<T> {
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
