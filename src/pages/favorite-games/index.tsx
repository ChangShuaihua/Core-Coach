import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, Star } from '@nutui/icons-react-taro'
import { getFavoriteGames, removeFavoriteGame } from '@/api/profile'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import type { Game } from '@/types/game'

const RESULT_CONFIG: ResultPreviewConfig = {
  step: 1,
  title: '游戏详情',
}

export default function FavoriteGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [detailData, setDetailData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      const data = await getFavoriteGames()
      setGames(data)
    } catch (error) {
      console.error('加载游戏失败:', error)
    }
  }

  const handleRemove = (id: number) => {
    Taro.showModal({
      title: '提示',
      content: '确定取消收藏？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await removeFavoriteGame(id)
            setGames(games.filter((g) => g.id !== id))
            Taro.showToast({ title: '已取消', icon: 'success' })
          } catch (error) {
            console.error('取消收藏失败:', error)
          }
        }
      },
    })
  }

  const handleGameClick = (game: Game) => {
    setSelectedGame(game)
    setDetailData({
      age: game.age,
      gameType: game.game_type,
      generatedResults: [
        {
          record_id: game.record_id,
          age: game.age,
          game_type: game.game_type,
          game_name: game.game_name,
          generated_content: game.generated_content,
          music: game.music,
          created_at: game.collected_at,
        },
      ],
    })
  }

  const handleBack = () => {
    if (selectedGame) {
      setSelectedGame(null)
      setDetailData({})
    } else {
      Taro.navigateBack()
    }
  }

  if (selectedGame) {
    return (
      <Layout title="游戏详情" showTabBar={false}>
        <ResultPreview config={RESULT_CONFIG} value={detailData} onChange={setDetailData} />
      </Layout>
    )
  }

  return (
    <Layout
      title="收藏游戏"
      showTabBar={false}
      renderLeft={
        <View onClick={handleBack}>
          <ArrowLeft />
        </View>
      }
    >
      <View className="p-4 bg-gray-1 min-h-screen">
        {games.length > 0 ? (
          <View>
            <Text className="text-sm text-gray-6 mb-4">共 {games.length} 个收藏</Text>
            {games.map((game) => (
              <Card key={game.id} className="mb-3" onClick={() => handleGameClick(game)}>
                <View className="px-4 py-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-base font-semibold text-gray-10">{game.game_name}</Text>
                    <Text
                      className="text-sm text-red"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(game.id)
                      }}
                    >
                      删除
                    </Text>
                  </View>
                  <View className="flex gap-4">
                    <Text className="text-xs text-gray-7">{game.age}岁</Text>
                    <View className="px-2 py-1 bg-orange-1 rounded-full">
                      <Text className="text-xs text-orange-6">{game.game_type}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View className="flex flex-col items-center justify-center pt-24">
            <Star color="#c9cdd4" size={48} />
            <Text className="text-base text-gray-5 mt-4">暂无收藏游戏</Text>
          </View>
        )}
      </View>
    </Layout>
  )
}
