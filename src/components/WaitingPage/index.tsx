import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useTaskStore } from '@/store/taskStore'

interface WaitingPageProps {
  title?: string
}

const statusTextMap: Record<string, string> = {
  pending: '任务排队中...',
  processing: '正在为你生成中...',
}

export default function WaitingPage({ title = '游戏' }: WaitingPageProps) {
  const { status, progress, error } = useTaskStore()

  const handleGoChat = () => {
    Taro.switchTab({ url: '/pages/chat/index' })
  }

  const handleGoProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' })
  }

  if (status === 'failed') {
    return (
      <View className="flex flex-col items-center justify-center h-full px-8">
        <Text className="text-4xl mb-4">😢</Text>
        <Text className="text-lg font-semibold text-gray-900 mb-2">生成失败</Text>
        <Text className="text-sm text-gray-500 mb-6 text-center">{error || '请稍后重试'}</Text>
        <View
          className="px-6 py-3 bg-orange-500 rounded-full"
          onClick={() => useTaskStore.getState().reset()}
        >
          <Text className="text-white text-sm font-medium">返回重试</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex flex-col items-center justify-center h-full px-8">
      {/* 动画区域 */}
      <View className="mb-8">
        <View className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
          <Text className="text-4xl">✨</Text>
        </View>
      </View>

      {/* 状态文案 */}
      <Text className="text-lg font-semibold text-gray-900 mb-2">正在为你生成{title}</Text>
      <Text className="text-sm text-gray-500 mb-6">{statusTextMap[status] || '处理中...'}</Text>

      {/* 进度条 */}
      <View className="w-full max-w-xs mb-8">
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-xs text-gray-400 text-center mt-2">{progress}%</Text>
      </View>

      {/* 提示文案 */}
      <Text className="text-xs text-gray-400 mb-8 text-center">
        预计需要30秒左右，你可以先去其他页面看看
      </Text>

      {/* 快捷跳转 */}
      <View className="flex gap-4">
        <View className="px-5 py-2 bg-gray-100 rounded-full" onClick={handleGoChat}>
          <Text className="text-sm text-gray-700">去问答</Text>
        </View>
        <View className="px-5 py-2 bg-gray-100 rounded-full" onClick={handleGoProfile}>
          <Text className="text-sm text-gray-700">个人中心</Text>
        </View>
      </View>
    </View>
  )
}
