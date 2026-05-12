import { Edit, Setting, Order, Star, Tips, Failure } from '@nutui/icons-react-taro'
import { ROUTES } from '@/config/routes'
import type { MenuGroup } from '../types'

// 主菜单配置
export const MAIN_MENU_ITEMS: MenuGroup = {
  id: 'main',
  items: [
    {
      id: 'edit-profile',
      title: '编辑资料',
      icon: <Edit color="#fe6601" size={20} />,
      path: ROUTES.EDIT_INFO,
    },
    {
      id: 'account-settings',
      title: '账号设置',
      icon: <Setting color="#fe6601" size={20} />,
      path: ROUTES.ACCOUNT_SETTINGS,
    },
    {
      id: 'favorite-lessons',
      title: '收藏教案',
      icon: <Order color="#fe6601" size={20} />,
      path: '/pages/profile/favorite-lessons/index',
    },
    {
      id: 'favorite-games',
      title: '收藏游戏',
      icon: <Star color="#fe6601" size={20} />,
      path: '/pages/profile/favorite-games/index',
    },
    {
      id: 'about',
      title: '关于',
      icon: <Tips color="#fe6601" size={20} />,
      path: '/pages/profile/about/index',
    },
  ],
}

// 退出登录配置
export const LOGOUT_MENU_ITEM = {
  id: 'logout',
  title: '退出登录',
  icon: <Failure color="#ee0a24" size={20} />,
}
