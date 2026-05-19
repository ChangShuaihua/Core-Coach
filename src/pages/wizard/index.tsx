import { useEffect, useState, useMemo } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getSkillDetail, generateByType } from '@/api/creation'
import Layout from '@/components/Layout'
import Wizard from '@/components/Wizard'
import type { SkillStepConfig } from '@/components/Wizard'
import { useCreationStore } from '@/store'
import { getConfigByType } from './constants/skillConfig'

/**
 * 创作向导页面入口
 *
 * 职责：
 * - 验证创作模式是否有效
 * - 从 API 获取技能配置
 * - 处理页面级别的导航和生命周期
 * - 将配置传递给 Wizard 容器组件
 */
export default function CreationWizardPage() {
  const { mode, isValid, clearMode } = useCreationStore()
  const router = useRouter()
  const [stepConfig, setStepConfig] = useState<SkillStepConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [skillName, setSkillName] = useState('')

  // 优先从路由参数获取业务类型，其次从 store 获取
  const businessType = router.params.type || mode || 'game'

  // 动态计算当前业务的步骤配置
  const currentConfig = useMemo(() => {
    return getConfigByType(businessType)
  }, [businessType])

  // 初始化：验证 mode 并加载配置
  useEffect(() => {
    if (!isValid()) {
      showInvalidModeToast()
      navigateToCreation()
      return
    }

    loadSkillConfig()
  }, [mode, isValid])

  /**
   * 从 API 加载技能配置
   */
  const loadSkillConfig = async () => {
    try {
      setLoading(true)
      const skillId = getSkillIdByMode(mode)
      const config = await getSkillDetail(skillId)

      if (config?.step_config) {
        const parsedConfig =
          typeof config.step_config === 'string'
            ? JSON.parse(config.step_config)
            : config.step_config

        setStepConfig(parsedConfig)
        setSkillName(config.name || getDefaultSkillName(mode))
      }
    } catch (error) {
      console.error('加载技能配置失败:', error)
      showErrorToast('加载配置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理生成（统一入口，根据业务类型动态分发）
   */
  const handleGenerate = async (data: Record<string, any>): Promise<Record<string, any> | null> => {
    try {
      console.log(`🎮 调用生成接口 [${businessType}]:`, data)

      // 根据业务类型构造不同的参数
      const params = buildGenerateParams(businessType, data)

      // 调用统一生成函数，自动分发到对应的 API
      const result = await generateByType(businessType, params)

      console.log('✅ 生成成功:', result)

      showSuccessToast('生成成功')

      // 返回生成结果，供 ResultPreview 使用
      return {
        generatedResults: [
          ...(data.generatedResults || []),
          {
            ...result,
            businessType,
          },
        ],
      }
    } catch (error) {
      console.error('❌ 生成失败:', error)
      showErrorToast('生成失败，请重试')
      return null
    }
  }

  /**
   * 处理向导完成
   */
  const handleWizardFinish = (data: Record<string, any>) => {
    console.log(`${mode} 创作完成:`, data)

    clearMode()
    showSuccessToast('生成成功')

    // 延迟导航，让用户看到成功提示
    setTimeout(() => {
      navigateToCreation()
    }, 2000)
  }

  /**
   * 处理取消操作
   */
  const handleCancel = () => {
    Taro.showModal({
      title: '确认退出',
      content: '退出后当前进度将不会保存，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          clearMode()
          navigateToCreation()
        }
      },
    })
  }

  // 无效的 mode，不渲染
  if (!mode || !isValid()) {
    return null
  }

  // 加载中
  if (loading) {
    return (
      <Layout title="加载中..." showTabBar={false}>
        <View className="flex items-center justify-center h-screen">
          <Text>加载配置中...</Text>
        </View>
      </Layout>
    )
  }

  // 配置加载失败
  if (!stepConfig) {
    return (
      <Layout title="错误" showTabBar={false}>
        <View className="flex items-center justify-center h-screen">
          <Text>配置加载失败</Text>
        </View>
      </Layout>
    )
  }

  return (
    <Layout
      title={skillName}
      showTabBar={false}
      renderLeft={
        <Text className="text-orange-600 text-base" onClick={handleCancel}>
          取消
        </Text>
      }
    >
      <Wizard stepConfig={stepConfig} onFinish={handleWizardFinish} onGenerate={handleGenerate} />
    </Layout>
  )
}

function getSkillIdByMode(mode: string | null): number {
  switch (mode) {
    case 'game':
      return 1
    case 'lesson':
      return 2
    default:
      return 1
  }
}

/**
 * 根据业务类型构造生成参数
 */
function buildGenerateParams(businessType: string, data: Record<string, any>): Record<string, any> {
  switch (businessType) {
    case 'game':
      return {
        age: parseInt(data.age) || 3,
        game_type: data.gameType || '循环式',
        player_count: parseInt(data.playerCount) || 2,
      }
    case 'lesson':
      return {
        sport_type: data.sportType || data.step_1 || '跑步',
        age: parseInt(data.age) || 6,
        duration: parseInt(data.duration) || 40,
      }
    default:
      return data
  }
}

/**
 * 根据 mode 获取默认的技能名称
 */
function getDefaultSkillName(mode: string | null): string {
  switch (mode) {
    case 'game':
      return '游戏生成'
    case 'lesson':
      return '教案生成'
    default:
      return '创作向导'
  }
}

/**
 * 显示无效 mode 的提示
 */
function showInvalidModeToast() {
  Taro.showToast({
    title: '请先选择创作类型',
    icon: 'none',
    duration: 2000,
  })
}

/**
 * 显示错误提示
 */
function showErrorToast(message: string) {
  Taro.showToast({
    title: message,
    icon: 'none',
    duration: 2000,
  })
}

/**
 * 显示成功提示
 */
function showSuccessToast(message: string) {
  Taro.showToast({
    title: message,
    icon: 'success',
    duration: 2000,
  })
}

/**
 * 导航到创作工坊首页
 */
function navigateToCreation() {
  Taro.switchTab({
    url: '/pages/creation/index',
  })
}
