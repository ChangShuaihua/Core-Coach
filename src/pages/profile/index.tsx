import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useUserStore } from '@/store/useUserStore'
import MenuList from './components/MenuList'
import UserInfoCard from './components/UserInfoCard'
import { MAIN_MENU_ITEMS, LOGOUT_MENU_ITEM } from './constants/menuConfig'
import type { UserInfo } from './types'

export default function ProfilePage() {
  const { clearToken } = useUserStore()

  const userInfo: UserInfo = {
    id: 1,
    uid: '10086',
    nickname: '跑酷教练大鹏',
    avatar: '',
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearToken()
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
            {/* 左侧：图标 + 文字 */}
            <View className="flex flex-row items-center">
              <View className="mr-3 flex">{LOGOUT_MENU_ITEM.icon}</View>
              <Text className="text-sm" style={{ color: '#ee0a24' }}>
                {LOGOUT_MENU_ITEM.title}
              </Text>
            </View>

            {/* 右侧：箭头 */}
            <ArrowRight size={16} color="#c8c9cc" />
          </View>
        </Card>
      </View>
    </Layout>
  )
}
