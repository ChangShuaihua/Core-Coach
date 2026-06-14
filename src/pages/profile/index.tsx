import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import { logout } from '@/api/login'
import { getUserInfo } from '@/api/profile'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useAuthCheck } from '@/hooks'
import { isRefreshTokenExpired } from '@/services/http'
import { useUserStore } from '@/store/useUserStore'
import { safeReLaunch } from '@/utils/route'
import MenuList from './components/MenuList'
import UserInfoCard from './components/UserInfoCard'
import { MAIN_MENU_ITEMS, LOGOUT_MENU_ITEM } from './constants/menuConfig'

export default function ProfilePage() {
  useAuthCheck()
  const { clearAuth, userInfo: storeUserInfo, setUserInfo } = useUserStore()

  const userInfo = storeUserInfo ?? {
    account: '',
    nickName: '未登录',
    avatarUrl: '',
  }

  // 每次页面展示时拉取最新用户信息
  Taro.useDidShow(async () => {
    try {
      const latest = await getUserInfo()
      if (storeUserInfo) {
        setUserInfo({ ...storeUserInfo, ...latest })
      }
    } catch {}
  })

  const handleLogout = async () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          let shouldClearAuth = false
          try {
            await logout()
            shouldClearAuth = true
          } catch {
            if (!isRefreshTokenExpired()) {
              Taro.showToast({ title: '登出失败，请重试', icon: 'none' })
              return
            }
            shouldClearAuth = true
          }
          if (!shouldClearAuth) return
          clearAuth()
          safeReLaunch({ url: '/pages/login/index', source: 'profile.logout' })
        }
      },
    })
  }

  return (
    <Layout title="个人中心">
      <View className="p-4">
        {/* 用户信息卡片 */}
        <Card className="mb-4">
          <UserInfoCard userInfo={userInfo} />
        </Card>

        {/* 主菜单列表 */}
        <Card className="mb-4">
          <MenuList menuGroup={MAIN_MENU_ITEMS} />
        </Card>

        {/* 退出登录 */}
        <Card>
          <View
            className="flex flex-row items-center justify-between px-4 py-4"
            hoverClass="bg-gray-50"
            hoverStayTime={100}
            onClick={handleLogout}
          >
            <View className="flex flex-row items-center">
              <View className="mr-3 flex">{LOGOUT_MENU_ITEM.icon}</View>
              <Text className="text-sm" style={{ color: '#ee0a24' }}>
                {LOGOUT_MENU_ITEM.title}
              </Text>
            </View>

            <ArrowRight size={16} color="#c8c9cc" />
          </View>
        </Card>
      </View>
    </Layout>
  )
}
