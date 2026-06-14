import Taro from '@tarojs/taro'

type RouteMethod = 'redirectTo' | 'reLaunch'

interface RouteOptions {
  url: string
  source?: string
}

const DUPLICATE_ROUTE_WINDOW = 800
let lastRoute: {
  method: RouteMethod
  url: string
  timestamp: number
} | null = null

function getPageStack() {
  try {
    return Taro.getCurrentPages().map((page) => ({
      route: page.route,
      options: page.options,
    }))
  } catch {
    return []
  }
}

function logRouteFail(method: RouteMethod, options: RouteOptions, error: unknown) {
  console.error('[Route] failed', {
    method,
    url: options.url,
    source: options.source,
    error,
    pages: getPageStack(),
  })
}

function logDuplicateRoute(method: RouteMethod, options: RouteOptions) {
  const now = Date.now()
  if (
    lastRoute &&
    lastRoute.method === method &&
    lastRoute.url === options.url &&
    now - lastRoute.timestamp < DUPLICATE_ROUTE_WINDOW
  ) {
    console.warn('[Route] duplicate route request', {
      method,
      url: options.url,
      source: options.source,
      pages: getPageStack(),
    })
  }

  lastRoute = {
    method,
    url: options.url,
    timestamp: now,
  }
}

export function safeRedirectTo(options: RouteOptions) {
  logDuplicateRoute('redirectTo', options)

  return Taro.redirectTo({
    url: options.url,
    fail: (error) => logRouteFail('redirectTo', options, error),
  })
}

export function safeReLaunch(options: RouteOptions) {
  logDuplicateRoute('reLaunch', options)

  return Taro.reLaunch({
    url: options.url,
    fail: (error) => logRouteFail('reLaunch', options, error),
  })
}
