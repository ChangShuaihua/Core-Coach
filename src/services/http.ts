import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'

const BASE_URL = process.env.TARO_APP_API_URL || 'https://your-api.com'
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

async function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method,
    data,
    header = {},
    withToken = true,
    showLoading = true,
    retryCount = 0,
    _isRetry = false,
  } = options

  if (withToken) {
    const token = useUserStore.getState().token
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
      useUserStore.getState().clearToken()
      Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' })
      }, 1500)
      return Promise.reject(new Error('未授权'))
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
      return request<T>({ ...options, retryCount: retryCount - 1, _isRetry: true })
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

export function upload<T = any>(
  url: string,
  filePath: string,
  name: string = 'file',
  formData?: Record<string, any>,
  options?: Partial<RequestOptions>
) {
  const { withToken = true, header = {} } = options || {}
  if (withToken) {
    const token = useUserStore.getState().token
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  log(`[UPLOAD] ${url}`, { name, formData })

  return new Promise<T>((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name,
      formData,
      header,
      success(res) {
        const body = JSON.parse(res.data) as ApiResponse<T>
        if (body.code >= 200 && body.code < 300) {
          resolve(body.data)
        } else {
          Taro.showToast({ title: body.message || '上传失败', icon: 'none' })
          reject(new Error(body.message || '上传失败'))
        }
      },
      fail(err) {
        Taro.showToast({ title: '上传失败，请稍后重试', icon: 'none' })
        reject(err)
      },
    })
  })
}
