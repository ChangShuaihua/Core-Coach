import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getTaskStatus, startGenerateTask } from '@/api/creation'
import { collectGame } from '@/api/profile'
import ActionBar from '@/components/ActionBar'
import type { ActionConfig } from '@/components/ActionBar'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import WaitingPage from '@/components/WaitingPage'
import { useCreationStore } from '@/store'
import type { TaskStatusCode } from '@/types/creation'
import { useShare } from '@/utils/share'
import { requestTaskCompleteSubscribe } from '@/utils/subscribe'

const RESULT_CONFIG: ResultPreviewConfig = {
  step: 1,
  title: '生成结果',
}

export default function ResultPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Record<string, any>>({})
  const [status, setStatus] = useState<TaskStatusCode | null>(null)
  const [createdAt, setCreatedAt] = useState('')
  const [liked, setLiked] = useState(false)

  const { setMode } = useCreationStore()

  const recordId = router.params.recordId

  const genResult = data.generatedResults?.[0]
  useShare(
    genResult?.game_name || '我生成了一个游戏，快来看看',
    `/pages/result/index?recordId=${recordId}`
  )

  useEffect(() => {
    if (!recordId) {
      setError('缺少记录ID')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const res = await getTaskStatus(Number(recordId))
        setStatus(res.status)
        setCreatedAt(res.created_at || '')

        if (res.status === 1 && res.generated_content) {
          setData({
            age: res.age,
            gameType: res.game_type,
            generatedResults: [res],
          })
        } else if (res.status === 3 || res.status === 2) {
          setData({
            age: res.age,
            gameType: res.game_type,
            userMessage: res.user_message || '正在生成中...',
            estimatedSeconds: res.estimated_seconds,
          })
        } else if (res.status === 0) {
          setError(res.user_message || '生成失败')
        }
      } catch (e) {
        setError('加载失败，请重试')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [recordId])

  if (loading) {
    return (
      <Layout title="加载中" showTabBar>
        <View className="flex items-center justify-center h-screen">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="提示" showTabBar>
        <View className="flex flex-col items-center justify-center h-screen">
          <Text className="text-gray-500 mb-4">{error}</Text>
        </View>
      </Layout>
    )
  }

  if (status === 2 || status === 3) {
    return (
      <Layout title="生成中" showTabBar>
        <WaitingPage title="游戏" />
      </Layout>
    )
  }

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
    const generatedResults = data.generatedResults || []
    const rid = generatedResults[0]?.record_id || recordId
    if (!rid) {
      Taro.showToast({ title: '无法获取记录ID', icon: 'none' })
      return
    }
    try {
      const res = await collectGame(Number(rid))
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

  const handlePrev = () => {
    setMode('game')
    Taro.redirectTo({ url: '/pages/wizard/index' })
  }

  const actions: ActionConfig[] = [
    { key: 'prev', type: 'back', onClick: handlePrev },
    { key: 'regenerate', type: 'regenerate', onClick: handleRegenerate },
    {
      key: 'share',
      type: 'share-image',
      shareData: genResult
        ? {
            gameName: genResult.game_name || '游戏',
            gameType: genResult.game_type || data.gameType || '团队游戏',
            age: genResult.age || data.age || 6,
            content: genResult.generated_content || '',
          }
        : undefined,
    },
    { key: 'collect', type: 'collect', liked, onClick: handleCollect },
  ]

  return (
    <Layout title="生成结果" showTabBar>
      {createdAt && (
        <View className="px-4 py-2 bg-gray-50">
          <Text className="text-xs text-gray-400">创建时间：{formatTime(createdAt)}</Text>
        </View>
      )}
      <ResultPreview
        config={RESULT_CONFIG}
        value={data}
        onChange={(newData) => setData((prev) => ({ ...prev, ...newData }))}
      />
      <ActionBar actions={actions} />
    </Layout>
  )
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  } catch {
    return dateStr
  }
}
