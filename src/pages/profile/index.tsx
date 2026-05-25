import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import { logout } from '@/api/login'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useUserStore } from '@/store/useUserStore'
import MenuList from './components/MenuList'
import UserInfoCard from './components/UserInfoCard'
import { MAIN_MENU_ITEMS, LOGOUT_MENU_ITEM } from './constants/menuConfig'

export default function ProfilePage() {
  const { clearAuth, userInfo: storeUserInfo } = useUserStore()

  const userInfo = storeUserInfo ?? {
    account: '',
    nickname: '未登录',
    avatar: '',
  }

  const handleLogout = async () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await logout()
          } catch {
            Taro.showToast({ title: '登出失败', icon: 'none' })
          }
          clearAuth()
          Taro.reLaunch({
            url: '/pages/login/index',
          })
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
