// tab 页路径（必须和 tabBar.list 里的 pagePath 一致）
export const TAB_PAGES = [
  'pages/chat/index',
  'pages/creation-home/index',
  'pages/profile/index',
] as const

// 普通页面路径
export const PAGES = ['pages/login/index', 'pages/creation-wizard/index'] as const

// 所有页面合并（app.config.ts 用这个）
export const ALL_PAGES = [...PAGES, ...TAB_PAGES]

// 路由常量（跳转时用，避免硬编码字符串）
export const ROUTES = {
  LOGIN: '/pages/login/index',
  CHAT: '/pages/chat/index',
  CREATION_HOME: '/pages/creation-home/index',
  CREATION_WIZARD: '/pages/creation-wizard/index',
  PROFILE: '/pages/profile/index',
  EDIT_INFO: '/pages/edit-info/index',
  ACCOUNT_SETTINGS: '/pages/account-settings/index',
  ABOUT: '/pages/about/index',
  FAVORITE_GAMES: '/pages/favorite-games/index',
  FAVORITE_LESSONS: '/pages/favorite-lessons/index',
} as const
