import { useEffect } from 'react'
import { Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Layout from '@/components/Layout'
import Wizard from '@/components/Wizard'
import { useCreationStore } from '@/store'
import { GAME_CREATION_CONFIG } from './configs/game'
import { LESSON_GENERATION_CONFIG } from './configs/lesson'
import type { WizardConfig } from './types/wizard'

/**
 * 创作向导页面（普通页面）
 * 通用多步骤流程，根据 mode 显示不同的配置
 */
export default function CreationWizardPage() {
  const { mode, isValid, clearMode } = useCreationStore()

  useEffect(() => {
    // 检查 mode 是否有效
    if (!isValid()) {
      // 如果无效或过期，重定向到创作工坊首页
      Taro.showToast({
        title: '请先选择创作类型',
        icon: 'none',
        duration: 2000,
      })
      Taro.switchTab({
        url: '/pages/creation/index',
      })
    }
  }, [isValid])

  // 根据 mode 选择不同的配置
  const getConfig = (): WizardConfig => {
    switch (mode) {
      case 'lesson':
        return LESSON_GENERATION_CONFIG
      case 'game':
      default:
        return GAME_CREATION_CONFIG
    }
  }

  const config = getConfig()

  const handleFinish = (data: Record<string, any>) => {
    console.log(`${mode} 创作完成:`, data)
    // 这里可以调用 API 保存数据

    // 完成后清除 Store
    clearMode()

    // 显示成功提示
    Taro.showToast({
      title: mode === 'lesson' ? '教案生成成功' : '游戏创建成功',
      icon: 'success',
      duration: 2000,
    })

    // 返回创作工坊首页
    setTimeout(() => {
      Taro.switchTab({
        url: '/pages/creation/index',
      })
    }, 2000)
  }

  const handleCancel = () => {
    Taro.showModal({
      title: '确认退出',
      content: '退出后当前进度将不会保存，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户确认取消时清除 Store
          clearMode()
          Taro.switchTab({
            url: '/pages/creation/index',
          })
        }
      },
    })
  }

  // 如果 mode 无效，不渲染内容（等待重定向）
  if (!mode || !isValid()) {
    return null
  }

  return (
    <Layout
      title={mode === 'lesson' ? '教案生成' : '游戏创作'}
      showTabBar={false}
      renderLeft={
        <Text className="text-orange-600 text-base" onClick={handleCancel}>
          取消
        </Text>
      }
    >
      <Wizard
        config={config}
        onFinish={handleFinish}
        finishButtonText={mode === 'lesson' ? '生成教案' : '生成游戏'}
      />
    </Layout>
  )
}
