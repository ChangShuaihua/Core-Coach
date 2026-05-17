import { Edit, Setting, Order, Star, Tips, Failure } from '@nutui/icons-react-taro'
import { ROUTES } from '@/config/routes'
import type { MenuGroup } from '@/types/profile'

// 主菜单配置
export const MAIN_MENU_ITEMS: MenuGroup = {
  id: 'main',
  items: [
    {
      id: 'edit-profile',
      title: '编辑资料',
      icon: <Edit color="#fe6601" size={18} />,
      path: ROUTES.EDIT_INFO,
    },
    {
      id: 'account-settings',
      title: '账号设置',
      icon: <Setting color="#fe6601" size={18} />,
      path: ROUTES.ACCOUNT_SETTINGS,
    },
    {
      id: 'favorite-lessons',
      title: '收藏教案',
      icon: <Order color="#fe6601" size={18} />,
      path: ROUTES.FAVORITE_LESSONS,
    },
    {
      id: 'favorite-games',
      title: '收藏游戏',
      icon: <Star color="#fe6601" size={18} />,
      path: ROUTES.FAVORITE_GAMES,
    },
    {
      id: 'about',
      title: '关于',
      icon: <Tips color="#fe6601" size={18} />,
      path: ROUTES.ABOUT,
    },
  ],
}

// 退出登录配置
export const LOGOUT_MENU_ITEM = {
  id: 'logout',
  title: '退出登录',
  icon: <Failure color="#ee0a24" size={20} />,
}
