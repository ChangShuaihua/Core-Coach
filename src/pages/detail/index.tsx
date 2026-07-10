import { useEffect, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { getTaskStatus, startGenerateTask } from '@/api/creation'
import { collectGame, removeFavoriteGame } from '@/api/profile'
import ActionBar from '@/components/ActionBar'
import type { ActionConfig } from '@/components/ActionBar'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import { safeRedirectTo } from '@/utils/route'
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
  const [favoriteId, setFavoriteId] = useState<number | null>(null)
  const [subPageActive, setSubPageActive] = useState(false)

  const genResult = data.generatedResults?.[0]
  const detailId = router.params?.id

  // 用 ref 确保分享回调始终取到最新游戏名（useShareAppMessage 在 mount 时注册，不会随渲染更新）
  const shareTitleRef = useRef('快来和我一起体验少儿跑酷！超有趣的运动游戏～')
  shareTitleRef.current = genResult?.game_name
    ? '快来看看我生成的跑酷游戏！超好玩～'
    : '快来和我一起体验少儿跑酷！超有趣的运动游戏～'

  useShareAppMessage(() => ({
    title: shareTitleRef.current,
    path: `/pages/detail/index?id=${detailId}`,
  }))

  useShareTimeline(() => ({
    title: shareTitleRef.current,
    query: `id=${detailId}`,
  }))

  useEffect(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      showShareItems: ['shareAppMessage', 'shareTimeline'],
    })
  }, [])

  useEffect(() => {
    if (detailId) {
      fetchGameDetail(detailId)
    }
  }, [detailId])

  const fetchGameDetail = async (id: string) => {
    try {
      setLoading(true)
      const game = await getTaskStatus(Number(id))
      setLiked(game.is_like === 1)
      setFavoriteId(game.favorite_id ?? null)
      setData({
        age: game.age,
        gameType: game.game_type,
        generatedResults: [game],
      })
    } catch (err: any) {
      console.error('加载详情失败:', err)
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
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

  const handleRegenerate = async () => {
    const retryParams = genResult?.retry_params
    if (!retryParams) {
      Taro.showToast({ title: '缺少生成参数', icon: 'none' })
      return
    }

    try {
      const res = await startGenerateTask(retryParams)
      Taro.showToast({ title: '任务已提交', icon: 'success', duration: 1500 })

      // 只有真正新建了任务才弹订阅（微任务阶段仍在微信 TAP 手势有效期内）
      if (res.status === 2) {
        requestTaskCompleteSubscribe().catch(() => {})
      }

      await new Promise((r) => setTimeout(r, 1500))
      safeRedirectTo({
        url: `/pages/result/index?recordId=${res.record_id}`,
        source: 'detail.regenerate',
      })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '重新生成失败', icon: 'none' })
    }
  }

  const handleCollect = async () => {
    if (liked) {
      if (!favoriteId) {
        Taro.showToast({ title: '无法取消收藏', icon: 'none' })
        return
      }
      try {
        await removeFavoriteGame(favoriteId)
        setLiked(false)
        setFavoriteId(null)
        Taro.showToast({ title: '已取消收藏', icon: 'success' })
      } catch (err: any) {
        Taro.showToast({ title: err?.message || '操作失败', icon: 'none' })
      }
      return
    }
    if (!genResult?.record_id) {
      Taro.showToast({ title: '无法获取记录ID', icon: 'none' })
      return
    }
    try {
      const res = await collectGame(genResult.record_id)
      setLiked(res.is_like === 1)
      // 收藏后重新拉取详情获取 favorite_id
      if (res.is_like === 1 && detailId) {
        const detail = await getTaskStatus(Number(detailId))
        setFavoriteId(detail.favorite_id ?? null)
      }
      Taro.showToast({ title: '收藏成功', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '操作失败', icon: 'none' })
    }
  }

  const isFromFavorites = router.params?.from === 'favorites'

  const actions: ActionConfig[] = [
    ...(!isFromFavorites
      ? [{ key: 'regenerate', type: 'regenerate' as const, onClick: handleRegenerate }]
      : []),
    {
      key: 'share',
      type: 'share-image' as const,
      shareData: genResult
        ? {
            gameName: genResult.game_name || '游戏',
            gameType: genResult.game_type || data.gameType || '团队游戏',
            age: genResult.age || data.age || 6,
            content: genResult.generated_content || '',
          }
        : undefined,
    },
    {
      key: 'collect',
      type: 'collect' as const,
      liked,
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
        onSubPageChange={setSubPageActive}
        showMusicSwitch
      />
      {!subPageActive && <ActionBar actions={actions} />}
    </Layout>
  )
}
