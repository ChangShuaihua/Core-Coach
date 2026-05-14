import { useRouter } from '@tarojs/taro'
import Layout from '@/components/Layout'
import WizardPage from '@/components/Step/WizardPage'
import { GAME_CREATION_CONFIG } from './configs/gameCreationConfig'
import { LESSON_GENERATION_CONFIG } from './configs/lessonGenerationConfig'
import type { WizardConfig } from './types/wizard'

export default function CreationPage() {
  const router = useRouter()
  const mode = router.params.mode || 'game' // 默认游戏模式

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
  }

  return (
    <Layout title={mode === 'lesson' ? '教案生成' : '游戏创作'}>
      <WizardPage
        config={config}
        onFinish={handleFinish}
        finishButtonText={mode === 'lesson' ? '生成教案' : '生成游戏'}
      />
    </Layout>
  )
}
