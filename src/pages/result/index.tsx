import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { getTaskStatus } from '@/api/creation'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import type { TaskStatusCode } from '@/types/creation'

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
          // 生成中或排队中
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

  // 生成中或排队中
  if (status === 2 || status === 3) {
    return (
      <Layout title="生成中" showTabBar>
        <View className="flex flex-col items-center justify-center h-screen px-8">
          <View className="mb-8">
            <View className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
              <Text className="text-4xl">✨</Text>
            </View>
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">正在为你生成游戏</Text>
          <Text className="text-sm text-gray-500 mb-4">{data.userMessage}</Text>
          {createdAt && (
            <Text className="text-xs text-gray-400">创建时间：{formatTime(createdAt)}</Text>
          )}
          <View className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mt-6" />
        </View>
      </Layout>
    )
  }

  return (
    <Layout title="生成结果" showTabBar>
      {createdAt && (
        <View className="px-4 py-2 bg-gray-50">
          <Text className="text-xs text-gray-400">创建时间：{formatTime(createdAt)}</Text>
        </View>
      )}
      <ResultPreview config={RESULT_CONFIG} value={data} onChange={setData} />
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
