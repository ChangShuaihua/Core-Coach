import { useEffect, useState } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { getGameDetailById } from '@/api/more'
import { collectGame } from '@/api/profile'
import ActionBar from '@/components/ActionBar'
import type { ActionConfig } from '@/components/ActionBar'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import { generateAndSaveImage } from '@/utils/shareImage'

const RESULT_CONFIG: ResultPreviewConfig = {
  step: 1,
  title: '游戏详情',
}

export default function DetailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Record<string, any>>({})

  useEffect(() => {
    const params = router.params || {}
    const id = params.id
    const type = params.type || 'game'

    if (id) {
      fetchGameDetail(id, type)
    }
  }, [])

  const fetchGameDetail = async (id: string, type: string) => {
    try {
      setLoading(true)
      const game = await getGameDetailById({ id, type })
      setData({
        age: game.age,
        gameType: game.game_type,
        generatedResults: [
          {
            record_id: game.id,
            age: game.age,
            game_type: game.game_type,
            game_name: game.title,
            generated_content: game.content,
            music: game.music,
            created_at: game.created_at,
          },
        ],
      })
    } catch (error) {
      console.error('加载详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="加载中..." showTabBar={false}>
        <View className="flex items-center justify-center h-screen">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      </Layout>
    )
  }

  if (!data.generatedResults) {
    return (
      <Layout title="错误" showTabBar={false}>
        <View className="flex flex-col items-center justify-center h-screen">
          <Text className="text-gray-400">未找到游戏数据</Text>
        </View>
      </Layout>
    )
  }

  const genResult = data.generatedResults?.[0]

  const handleRegenerate = () => {
    Taro.navigateTo({ url: `/pages/wizard/index?type=${genResult?.game_type || 'game'}` })
  }

  const handleShare = async () => {
    if (!genResult) return
    const success = await generateAndSaveImage({
      gameName: genResult.game_name || '游戏',
      gameType: genResult.game_type || data.gameType || '团队游戏',
      age: genResult.age || data.age || 6,
      content: genResult.generated_content || '',
    })
    if (success) {
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } else {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const handleCollect = async () => {
    if (!genResult?.record_id) {
      Taro.showToast({ title: '无法获取记录ID', icon: 'none' })
      return
    }
    try {
      await collectGame(genResult.record_id)
      Taro.showToast({ title: '收藏成功', icon: 'success' })
    } catch {
      Taro.showToast({ title: '收藏失败', icon: 'none' })
    }
  }

  const actions: ActionConfig[] = [
    {
      key: 'regenerate',
      label: '重新生成',
      icon: 'refresh',
      color: '#FF7A2F',
      bgColor: '#FFF7F2',
      onClick: handleRegenerate,
    },
    {
      key: 'share',
      label: '分享图片',
      icon: 'photo',
      color: '#7C5CFC',
      bgColor: '#F3F0FF',
      onClick: handleShare,
    },
    {
      key: 'collect',
      label: '收藏',
      icon: 'star',
      color: '#FFFFFF',
      bgColor: '#FF7A2F',
      onClick: handleCollect,
    },
  ]

  return (
    <Layout
      title="游戏详情"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <Canvas
        type="2d"
        id="shareCanvas"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '300px',
          height: '420px',
        }}
      />
      <ResultPreview
        config={RESULT_CONFIG}
        value={data}
        onChange={(newData) => setData((prev) => ({ ...prev, ...newData }))}
        showMusicSwitch
      />
      <ActionBar actions={actions} />
    </Layout>
  )
}
