import { useEffect, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { startGenerateTask } from '@/api/creation'
import Layout from '@/components/Layout'
import Wizard from '@/components/Wizard'
import type { SkillStepConfig } from '@/components/Wizard'
import { useCreationStore } from '@/store'
import { useTaskStore } from '@/store/taskStore'
import type { GenerateGameParams } from '@/types/creation'
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

  // 初始化：验证 mode 并加载配置
  useEffect(() => {
    if (!isValid()) {
      navigateToCreation()
      return
    }

    setLoading(true)
    const config = getConfigByType(businessType)
    if (config?.step_config) {
      setStepConfig(config.step_config)
      setSkillName(config.name || getDefaultSkillName(mode))
    }
    setLoading(false)
  }, [mode, isValid, businessType])

  /**
   * 处理生成（启动异步任务）
   */
  const handleGenerate = async (
    data: Record<string, any>
  ): Promise<{ recordId: number; businessType: string; isNewlyCreated: boolean } | null> => {
    try {
      const params = buildGenerateParams(businessType, data)
      const result = await startGenerateTask(params)
      return {
        recordId: result.record_id,
        businessType,
        // status: 2 = 排队中（真正新建），status: 3 = 生成中（已有任务）
        isNewlyCreated: result.status === 2,
      }
    } catch (error: any) {
      console.error('❌ 生成失败:', error)
      // 超时/网络错误已由 HTTP 客户端统一处理，只处理业务错误
      if (error?.code) {
        showErrorToast(error.message)
      }
      return null
    }
  }

  /**
   * 处理向导完成
   */
  const handleWizardFinish = () => {
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

  /**
   * 任务提交成功：toast 提示 → 等待 → 跳转
   * 注意：订阅请求已在用户点击按钮时同步触发（微信要求必须在 TAP 手势上下文中调用）
   */
  const handleTaskSubmitted = async (recordId: number, _isNewlyCreated: boolean) => {
    const store = useTaskStore.getState()
    if (
      store.recordId === recordId &&
      (store.status === 'pending' || store.status === 'processing')
    ) {
      // 同一个任务还在进行中，不重复提交
      Taro.showToast({ title: '任务已在进行中', icon: 'none', duration: 1500 })
      await new Promise((r) => setTimeout(r, 1500))
      navigateToCreation()
      clearMode()
      return
    }
    store.startTask(recordId, businessType)
    Taro.showToast({ title: '任务已提交', icon: 'success', duration: 1500 })
    await new Promise((r) => setTimeout(r, 1500))
    navigateToCreation()
    clearMode()
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
        <View onClick={handleCancel}>
          <ArrowLeft />
        </View>
      }
    >
      <Wizard
        stepConfig={stepConfig}
        onFinish={handleWizardFinish}
        onGenerate={handleGenerate}
        onTaskSubmitted={handleTaskSubmitted}
      />
    </Layout>
  )
}

/**
 * 根据业务类型构造生成参数
 */
function buildGenerateParams(businessType: string, data: Record<string, any>): GenerateGameParams {
  switch (businessType) {
    case 'game':
      return {
        age: parseInt(data.age) || 3,
        game_type: data.gameType || '循环式',
        player_count: parseInt(data.playerCount) || 2,
      }
    default:
      return {
        age: parseInt(data.age) || 3,
        game_type: data.gameType || '循环式',
      }
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
