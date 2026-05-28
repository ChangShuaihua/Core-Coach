import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { getGameDetailById } from '@/api/more'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'

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
      // 转换为 ResultPreview 需要的格式
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
        <View className="flex items-center justify-center h-screen">
          <Text className="text-gray-400">未找到游戏数据</Text>
        </View>
      </Layout>
    )
  }

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
      <ResultPreview
        config={RESULT_CONFIG}
        value={data}
        onChange={setData}
        showMusicSwitch={false}
      />
    </Layout>
  )
}
