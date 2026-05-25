import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, User, Play } from '@nutui/icons-react-taro'
import { getGameDetail } from '@/api/profile'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import type { Game } from '@/types/game'

interface GameDetailProps {
  game: Game
  onBack?: () => void
}

export default function GameDetail({ game, onBack }: GameDetailProps) {
  const [detailGame, setDetailGame] = useState<Game>(game)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<Taro.InnerAudioContext | null>(null)

  useEffect(() => {
    loadGameDetail()
  }, [game.id])

  const loadGameDetail = async () => {
    setIsLoading(true)
    try {
      const result = await getGameDetail(game.id)
      if (result) {
        setDetailGame(result)
      }
    } catch (error) {
      console.error('加载游戏详情失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const initAudio = useCallback(() => {
    const musicUrl = detailGame.music?.trim().replace(/^`|`$/g, '')
    if (musicUrl && !audioRef.current) {
      audioRef.current = Taro.createInnerAudioContext()
      audioRef.current.src = musicUrl
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
    const musicUrl = detailGame.music?.trim().replace(/^`|`$/g, '')
    if (!musicUrl) {
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
            <Text className="text-xl font-bold text-gray-10">{detailGame.game_name}</Text>
            <View className="px-3 py-1 bg-orange-1 rounded-full whitespace-nowrap">
              <Text className="text-sm text-orange-6">{detailGame.game_type}</Text>
            </View>
          </View>
          <View className="flex gap-6 mb-4">
            <View className="flex items-center gap-2">
              <User size={16} className="text-gray-5" />
              <Text className="text-sm text-gray-6">平均年龄：{detailGame.age}岁</Text>
            </View>
          </View>
        </Card>

        <Card className="p-6 mb-4 mr-1">
          <Text className="text-base font-semibold text-gray-10 mb-4">收藏时间</Text>
          <View>
            <Text className="text-sm text-gray-7">{detailGame.collected_at}</Text>
          </View>
        </Card>
        <Card className="p-6 mb-4 mr-1">
          <Text className="text-base font-semibold text-gray-10 mb-4">游戏详情</Text>
          <View>
            <Text className="text-sm text-gray-7">
              {detailGame.generated_content || '暂无详情'}
            </Text>
          </View>
        </Card>
      </View>

      {detailGame.music?.trim().replace(/^`|`$/g, '') && (
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
