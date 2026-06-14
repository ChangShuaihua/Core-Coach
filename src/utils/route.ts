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

function normalizeRoute(url: string) {
  return url.split('?')[0].replace(/^\//, '')
}

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

function shouldSkipRoute(method: RouteMethod, options: RouteOptions) {
  const now = Date.now()
  const pages = getPageStack()
  const currentRoute = pages[pages.length - 1]?.route
  const targetRoute = normalizeRoute(options.url)

  if (currentRoute === targetRoute) {
    return true
  }

  if (
    lastRoute &&
    lastRoute.url === options.url &&
    now - lastRoute.timestamp < DUPLICATE_ROUTE_WINDOW
  ) {
    return true
  }

  lastRoute = {
    method,
    url: options.url,
    timestamp: now,
  }

  return false
}

export function safeRedirectTo(options: RouteOptions) {
  if (shouldSkipRoute('redirectTo', options)) return Promise.resolve()

  return Taro.redirectTo({
    url: options.url,
    fail: (error) => logRouteFail('redirectTo', options, error),
  })
}

export function safeReLaunch(options: RouteOptions) {
  if (shouldSkipRoute('reLaunch', options)) return Promise.resolve()

  return Taro.reLaunch({
    url: options.url,
    fail: (error) => logRouteFail('reLaunch', options, error),
  })
}
