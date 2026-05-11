import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Header from './Header'
import TabBar from './TabBar'

interface LayoutProps {
  title?: string
  children: ReactNode
  showTabBar?: boolean // 是否显示底部 TabBar，默认 true
  renderCustomHeader?: Parameters<typeof Header>[0]['renderCustomHeader']
}

export default function Layout({
  title,
  children,
  showTabBar = true,
  renderCustomHeader,
}: LayoutProps) {
  const [safeAreaBottom, setSafeAreaBottom] = useState(0)

  useEffect(() => {
    if (showTabBar) {
      // 获取安全区域信息，计算底部内边距
      try {
        const systemInfo = Taro.getWindowInfo()
        const safeArea = systemInfo.safeArea
        if (safeArea) {
          const bottomSafeHeight = systemInfo.screenHeight - safeArea.bottom
          setSafeAreaBottom(bottomSafeHeight)
        }
      } catch (error) {
        console.error('获取安全区域信息失败:', error)
      }
    }
  }, [showTabBar])

  // TabBar 基础高度约 50px，加上安全区域高度
  const tabBarHeight = showTabBar ? 60 + safeAreaBottom : 0

  return (
    <View className="h-screen flex flex-col bg-white overflow-hidden">
      {/* 顶部导航栏 */}
      <Header title={title} renderCustomHeader={renderCustomHeader} />

      {/* 页面内容区，底部留出 TabBar 的高度 + 安全区域 */}
      <View
        className="flex-1 overflow-hidden"
        style={showTabBar ? { marginBottom: `${tabBarHeight}px` } : {}}
      >
        {children}
      </View>

      {/* 底部 TabBar */}
      {showTabBar && <TabBar />}
    </View>
  )
}
