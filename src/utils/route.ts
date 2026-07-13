import Taro from '@tarojs/taro'

type RouteMethod = 'redirectTo' | 'reLaunch' | 'navigateTo' | 'switchTab'

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
let pendingRoute: {
  method: RouteMethod
  url: string
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

  if (pendingRoute?.method === method && pendingRoute.url === options.url) {
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
  pendingRoute = {
    method,
    url: options.url,
  }

  return false
}

function clearPendingRoute(method: RouteMethod, options: RouteOptions) {
  if (pendingRoute?.method === method && pendingRoute.url === options.url) {
    pendingRoute = null
  }
}

export function safeRedirectTo(options: RouteOptions) {
  if (shouldSkipRoute('redirectTo', options)) return Promise.resolve()

  return Taro.redirectTo({
    url: options.url,
    success: () => clearPendingRoute('redirectTo', options),
    fail: (error) => {
      clearPendingRoute('redirectTo', options)
      logRouteFail('redirectTo', options, error)
    },
  })
}

export function safeReLaunch(options: RouteOptions) {
  if (shouldSkipRoute('reLaunch', options)) return Promise.resolve()

  return Taro.reLaunch({
    url: options.url,
    success: () => clearPendingRoute('reLaunch', options),
    fail: (error) => {
      clearPendingRoute('reLaunch', options)
      logRouteFail('reLaunch', options, error)
    },
  })
}

export function safeNavigateTo(options: RouteOptions) {
  if (shouldSkipRoute('navigateTo', options)) return Promise.resolve()

  return Taro.navigateTo({
    url: options.url,
    success: () => clearPendingRoute('navigateTo', options),
    fail: (error) => {
      clearPendingRoute('navigateTo', options)
      logRouteFail('navigateTo', options, error)
    },
  })
}

export function safeSwitchTab(options: RouteOptions) {
  if (shouldSkipRoute('switchTab', options)) return Promise.resolve()

  return Taro.switchTab({
    url: options.url,
    success: () => clearPendingRoute('switchTab', options),
    fail: (error) => {
      clearPendingRoute('switchTab', options)
      logRouteFail('switchTab', options, error)
    },
  })
}
