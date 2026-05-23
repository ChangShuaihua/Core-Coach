import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, User, Play } from '@nutui/icons-react-taro'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import type { Game } from '@/types/creation'

interface GameDetailProps {
  game: Game
  onBack?: () => void
}

export default function GameDetail({ game, onBack }: GameDetailProps) {
  const detailGame = game
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<Taro.InnerAudioContext | null>(null)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const initAudio = useCallback(() => {
    if (detailGame.music && !audioRef.current) {
      audioRef.current = Taro.createInnerAudioContext()
      audioRef.current.src = detailGame.music
      audioRef.current.loop = true
      audioRef.current.autoplay = false

      audioRef.current.onTimeUpdate(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      })

      audioRef.current.onCanplay(() => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
        }
      })

      audioRef.current.onEnded(() => {
        setIsPlaying(false)
      })

      audioRef.current.onError(() => {
        setIsPlaying(false)
      })
    }
  }, [detailGame.music])

  useEffect(() => {
    initAudio()
    return () => {
      if (audioRef.current) {
        audioRef.current.stop()
        audioRef.current.destroy()
        audioRef.current = null
      }
    }
  }, [initAudio])

  const toggleAudio = () => {
    if (!detailGame.music) {
      Taro.showToast({ title: '暂无背景音乐', icon: 'none' })
      return
    }

    if (!audioRef.current) {
      initAudio()
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleSliderChange = (e: { detail: { value: number } }) => {
    if (audioRef.current) {
      const time = e.detail.value
      audioRef.current.seek(time)
      setCurrentTime(time)
    }
  }

  return (
    <Layout
      title="游戏详情"
      showTabBar={false}
      renderLeft={
        <View onClick={() => (onBack ? onBack() : Taro.navigateBack())}>
          <ArrowLeft />
        </View>
      }
    >
      <View className="pl-4 pr-3 bg-gray-1 min-h-screen pb-32">
        <Card className="p-6 mb-4 mr-1">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-10">{detailGame.title}</Text>
            {detailGame.game_type && (
              <View className="px-3 py-1 bg-orange-1 rounded-full">
                <Text className="text-sm text-orange-6">{detailGame.game_type}</Text>
              </View>
            )}
          </View>
          <View className="flex gap-6 mb-4">
            {detailGame.player_count && (
              <View className="flex items-center gap-2">
                <User size={16} className="text-gray-5" />
                <Text className="text-sm text-gray-6">{detailGame.player_count}人</Text>
              </View>
            )}
            {detailGame.age && (
              <View className="flex items-center gap-2">
                <Text className="text-sm text-gray-6">{detailGame.age}岁</Text>
              </View>
            )}
          </View>

          <Text className="text-base text-gray-7 leading-relaxed">{detailGame.content}</Text>
        </Card>

        {detailGame.preparation && detailGame.preparation.length > 0 && (
          <Card className="p-6 mb-4 mr-1">
            <Text className="text-base font-semibold text-gray-10 mb-4">前提准备</Text>
            <View>
              {detailGame.preparation.map((item, index) => (
                <View
                  key={index}
                  className={`flex items-start gap-3 px-2 ${index < detailGame.preparation!.length - 1 ? 'mb-2' : ''}`}
                >
                  <View className="w-2 h-2 bg-orange-5 rounded-full flex-shrink-0 mt-2" />
                  <Text className="text-sm text-gray-7">{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {detailGame.playSteps && detailGame.playSteps.length > 0 && (
          <Card className="p-6 mb-4 mr-1">
            <Text className="text-base font-semibold text-gray-10 mb-4">游戏玩法</Text>
            <View>
              {detailGame.playSteps.map((step, index) => (
                <View
                  key={index}
                  className={`flex items-start gap-3 px-2 ${index < detailGame.playSteps!.length - 1 ? 'mb-3' : ''}`}
                >
                  <View className="w-6 h-6 bg-orange-1 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Text className="text-xs text-orange-6 font-medium">{index + 1}</Text>
                  </View>
                  <Text className="text-sm text-gray-7">{step}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>

      {detailGame.music && (
        <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-2 p-4">
          <View className="flex items-center gap-3">
            <View
              className="w-12 h-12 bg-orange-1 rounded-full flex items-center justify-center flex-shrink-0"
              onClick={toggleAudio}
            >
              {isPlaying ? (
                <Text className="text-orange-6 text-sm font-bold">||</Text>
              ) : (
                <Play size={20} className="text-orange-6" />
              )}
            </View>
            <View className="flex-1">
              <Slider
                min={0}
                max={duration || 100}
                value={currentTime}
                step={0.1}
                activeColor="#fe6601"
                backgroundColor="#e5e5e5"
                blockSize={16}
                showValue={false}
                onChange={handleSliderChange}
                className="w-full"
              />
              <View className="flex justify-between mt-1">
                <Text className="text-xs text-gray-5">{formatTime(currentTime)}</Text>
                <Text className="text-xs text-gray-5">{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Layout>
  )
}
