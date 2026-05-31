import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { getTaskStatus, startGenerateTask } from '@/api/creation'
import { collectGame } from '@/api/profile'
import ActionBar from '@/components/ActionBar'
import type { ActionConfig } from '@/components/ActionBar'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import { useShare } from '@/utils/share'
import { requestTaskCompleteSubscribe } from '@/utils/subscribe'

const RESULT_CONFIG: ResultPreviewConfig = {
  step: 1,
  title: '游戏详情',
}

export default function DetailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Record<string, any>>({})
  const [liked, setLiked] = useState(false)

  const detailGenResult = data.generatedResults?.[0]
  const detailParams = router.params || {}
  useShare(
    detailGenResult?.game_name || '我生成了一个游戏，快来看看',
    `/pages/detail/index?id=${detailParams.id}&type=${detailParams.type || 'game'}`
  )

  const detailId = router.params?.id
  const isLikeParam = router.params?.is_like

  useEffect(() => {
    if (isLikeParam === '1') {
      setLiked(true)
    }

    if (detailId) {
      fetchGameDetail(detailId)
    }
  }, [detailId, isLikeParam])

  const fetchGameDetail = async (id: string) => {
    try {
      setLoading(true)
      const game = await getTaskStatus(Number(id))
      setData({
        age: game.age,
        gameType: game.game_type,
        generatedResults: [game],
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

  const handleRegenerate = async () => {
    requestTaskCompleteSubscribe()
    const retryParams = genResult?.retry_params
    if (!retryParams) {
      Taro.showToast({ title: '缺少生成参数', icon: 'none' })
      return
    }
    try {
      const res = await startGenerateTask(retryParams)
      Taro.showToast({ title: '任务已提交', icon: 'success' })
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/result/index?recordId=${res.record_id}` })
      }, 1500)
    } catch {
      Taro.showToast({ title: '重新生成失败', icon: 'none' })
    }
  }

  const handleCollect = async () => {
    if (!genResult?.record_id) {
      Taro.showToast({ title: '无法获取记录ID', icon: 'none' })
      return
    }
    try {
      const res = await collectGame(genResult.record_id)
      setLiked(res.is_like === 1)
      Taro.showToast({ title: res.is_like === 1 ? '收藏成功' : '已取消收藏', icon: 'success' })
    } catch (err: any) {
      if (err?.code === 3002) {
        setLiked(true)
        Taro.showToast({ title: '已收藏', icon: 'success' })
      } else {
        Taro.showToast({ title: '操作失败', icon: 'none' })
      }
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
      label: '分享',
      icon: 'photo',
      color: '#7C5CFC',
      bgColor: '#F3F0FF',
      type: 'share',
    },
    {
      key: 'collect',
      label: liked ? '已收藏' : '收藏',
      icon: 'star',
      color: liked ? '#FF7A2F' : '#FFFFFF',
      bgColor: liked ? '#FFF7F2' : '#FF7A2F',
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
