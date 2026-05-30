import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import frame1 from '@/assets/images/frame1.png'
import frame2 from '@/assets/images/frame2.png'
import frame3 from '@/assets/images/frame3.png'
import frame4 from '@/assets/images/frame4.png'
import { useTaskStore } from '@/store/taskStore'

const frames = [frame1, frame2, frame3, frame4]

function FrameAnimation() {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <View className="relative" style={{ width: '200px', height: '200px' }}>
      {frames.map((src, index) => (
        <Image
          key={index}
          src={src}
          mode="aspectFit"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '200px',
            height: '200px',
            opacity: index === frameIndex ? 1 : 0,
          }}
        />
      ))}
    </View>
  )
}

interface WaitingPageProps {
  title?: string
}

export default function WaitingPage({ title = '游戏' }: WaitingPageProps) {
  const { status, statusText, error } = useTaskStore()

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
      {/* 帧动画区域 */}
      <View className="mb-8">
        <FrameAnimation />
      </View>

      {/* 状态文案 */}
      <Text className="text-lg font-semibold text-gray-900 mb-2">正在为你生成{title}</Text>
      <Text className="text-sm text-gray-500 mb-6">{statusText || '处理中...'}</Text>

      {/* 加载动画 */}
      <View className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-8" />

      <Text className="text-xs text-gray-400">预计需要3-4分钟</Text>
    </View>
  )
}
