import { useEffect, useState } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getTaskStatus, startGenerateTask } from '@/api/creation'
import { collectGame } from '@/api/profile'
import ActionBar from '@/components/ActionBar'
import type { ActionConfig } from '@/components/ActionBar'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import WaitingPage from '@/components/WaitingPage'
import type { TaskStatusCode } from '@/types/creation'
import { generateAndSaveImage } from '@/utils/shareImage'
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

  const recordId = router.params.recordId

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
    try {
      const res = await startGenerateTask({
        age: parseInt(data.age) || 3,
        game_type: data.gameType || '循环式',
      })
      Taro.showToast({ title: '任务已提交', icon: 'success' })
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/result/index?recordId=${res.record_id}` })
      }, 1500)
    } catch {
      Taro.showToast({ title: '重新生成失败', icon: 'none' })
    }
  }

  const handleShare = async () => {
    const generatedResults = data.generatedResults || []
    if (generatedResults.length === 0) {
      Taro.showToast({ title: '暂无生成结果', icon: 'none' })
      return
    }
    const genResult = generatedResults[0]
    const success = await generateAndSaveImage({
      gameName: genResult.game_name || '新生成游戏',
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
    const generatedResults = data.generatedResults || []
    const rid = generatedResults[0]?.record_id || recordId
    if (!rid) {
      Taro.showToast({ title: '无法获取记录ID', icon: 'none' })
      return
    }
    try {
      await collectGame(Number(rid))
      Taro.showToast({ title: '收藏成功', icon: 'success' })
    } catch {
      Taro.showToast({ title: '收藏失败', icon: 'none' })
    }
  }

  const actions: ActionConfig[] = [
    {
      key: 'prev',
      label: '上一步',
      icon: 'arrow-left',
      color: '#4B5563',
      bgColor: '#F3F4F6',
      onClick: () => Taro.navigateBack(),
    },
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
    <Layout title="生成结果" showTabBar>
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
