import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface MenuButtonInfo {
  top: number
  height: number
  statusBarHeight: number
  width: number
  marginRight: number
}

interface HeaderProps {
  title?: string
  renderCustomHeader?: (
    navHeight: number,
    statusBarHeight: number,
    horizontalPadding: number
  ) => ReactNode
  renderLeft?: ReactNode
}

// 内部 NavBar，拿到胶囊信息后才渲染
function NavBar({
  title,
  menuButton,
  renderCustomHeader,
  renderLeft,
}: HeaderProps & { menuButton: MenuButtonInfo }) {
  const capsuleBottomY = menuButton.top + menuButton.height
  const capsuleMarginTop = Math.max(menuButton.top - menuButton.statusBarHeight, 0)
  // 增加底部间距，让导航栏更高，视觉更舒适
  const navHeight = Math.max(capsuleBottomY + capsuleMarginTop, 40)
  const { statusBarHeight } = menuButton
  const horizontalPadding = menuButton.width + menuButton.marginRight * 2

  return (
    <>
      {/* 固定在顶部的导航栏 */}
      <View className="fixed left-0 right-0 top-0 z-800 bg-white">
        {/* 左侧自定义内容 */}
        {renderLeft && (
          <View
            className="absolute flex items-center"
            style={{
              left: '20px',
              top: `${menuButton.top}px`,
              height: `${menuButton.height}px`,
            }}
          >
            {renderLeft}
          </View>
        )}
        <View
          style={{
            height: `${navHeight}px`,
          }}
        >
          {/* 标题内容区：绝对定位对齐胶囊按钮的垂直中心，兼容安卓/iOS */}
          <View
            className="absolute flex items-center justify-center"
            style={{
              left: `${horizontalPadding}px`,
              right: `${horizontalPadding}px`,
              top: `${menuButton.top}px`,
              height: `${menuButton.height}px`,
            }}
          >
            {title && (
              <Text className="text-base text-gray-9" style={{ lineHeight: '1' }}>
                {title}
              </Text>
            )}
          </View>
        </View>
        {/* 支持自定义扩展内容（如搜索栏、Tab 切换等） */}
        {renderCustomHeader?.(navHeight, statusBarHeight, horizontalPadding)}
      </View>

      {/* 占位元素，防止内容被固定导航栏遮挡 */}
      <View className="invisible">
        <View style={{ height: `${navHeight}px`, width: '100%' }} />
        {renderCustomHeader?.(navHeight, statusBarHeight, horizontalPadding)}
      </View>
    </>
  )
}

export default function Header({ title, renderCustomHeader, renderLeft }: HeaderProps) {
  const [menuButton, setMenuButton] = useState<MenuButtonInfo | null>(null)

  useEffect(() => {
    try {
      const windowInfo = Taro.getWindowInfo()
      let menuButtonInfo

      if (process.env.TARO_ENV === 'h5') {
        menuButtonInfo = {
          top: 7,
          height: 32,
          width: 87,
          right: windowInfo.windowWidth - 7,
        }
      } else {
        menuButtonInfo = Taro.getMenuButtonBoundingClientRect()
      }

      setMenuButton({
        top: menuButtonInfo.top,
        height: menuButtonInfo.height,
        statusBarHeight: windowInfo.statusBarHeight || 0,
        width: menuButtonInfo.width,
        marginRight: windowInfo.windowWidth - menuButtonInfo.right,
      })
    } catch (error) {
      console.error('获取菜单按钮信息失败:', error)
    }
  }, [])

  if (!menuButton) {
    return null
  }

  return (
    <NavBar
      title={title}
      menuButton={menuButton}
      renderCustomHeader={renderCustomHeader}
      renderLeft={renderLeft}
    />
  )
}
