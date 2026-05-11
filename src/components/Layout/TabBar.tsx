import { useEffect, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Edit, Message, User } from '@nutui/icons-react-taro'
import { clsx } from 'clsx'
import { ROUTES } from '@/config/routes'

// tab 配置
const TAB_LIST = [
  {
    key: 'index',
    text: '问答',
    path: ROUTES.CHAT,
    icon: <Message size="18" color="#999" />,
    activeIcon: <Message size="20" color="#fe6601" />,
  },
  {
    key: 'creation',
    text: '创作',
    path: ROUTES.CREATION,
    icon: <Edit size="18" color="#999" />,
    activeIcon: <Edit size="20" color="#fe6601" />,
  },
  {
    key: 'profile',
    text: '我的',
    path: ROUTES.PROFILE,
    icon: <User size="18" color="#999" />,
    activeIcon: <User size="20" color="#fe6601" />,
  },
]

export default function TabBar() {
  const router = useRouter()
  const [safeAreaBottom, setSafeAreaBottom] = useState(0)

  // 当前路径，用于判断哪个 tab 是激活状态
  const currentPath = router.path

  useEffect(() => {
    // 获取安全区域信息，适配 iPhone 底部小黑条
    try {
      const systemInfo = Taro.getWindowInfo()
      const safeArea = systemInfo.safeArea
      if (safeArea) {
        // 计算底部安全区域高度
        const bottomSafeHeight = systemInfo.screenHeight - safeArea.bottom
        setSafeAreaBottom(bottomSafeHeight)
      }
    } catch (error) {
      console.error('获取安全区域信息失败:', error)
    }
  }, [])

  const handleTabClick = (path: string) => {
    if (currentPath === path) return
    Taro.switchTab({ url: path })
  }

  return (
    <>
      <View
        className="fixed bottom-0 left-0 right-0 z-900 flex flex-row bg-white"
        style={{
          paddingBottom: `${safeAreaBottom}px`,
          borderTop: '1px solid #ebedf0',
        }}
      >
        {TAB_LIST.map((tab) => {
          const isActive = currentPath === tab.path
          return (
            <View
              key={tab.key}
              className="flex-1 flex flex-col items-center justify-center py-2"
              onClick={() => handleTabClick(tab.path)}
            >
              <Text className="text-base">{isActive ? tab.activeIcon : tab.icon}</Text>
              <Text
                className={clsx('text-xs', {
                  'text-primary font-medium': isActive,
                  'text-gray-9': !isActive,
                })}
              >
                {tab.text}
              </Text>
            </View>
          )
        })}
      </View>
    </>
  )
}
