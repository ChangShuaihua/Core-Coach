import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, ArrowRight, Star } from '@nutui/icons-react-taro'
import { Checkbox } from '@nutui/nutui-react-taro'
import {
  getFavoriteGames,
  getGameDetail,
  removeFavoriteGame,
  batchRemoveFavoriteGames,
  type FavoriteGamesResult,
} from '@/api/profile'
import ActionBar from '@/components/ActionBar'
import type { ActionConfig } from '@/components/ActionBar'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import ResultPreview from '@/components/ResultPreview'
import type { ResultPreviewConfig } from '@/components/ResultPreview'
import type { Game } from '@/types/game'
import { useShare } from '@/utils/share'

const RESULT_CONFIG: ResultPreviewConfig = {
  step: 1,
  title: '游戏详情',
}

const PAGE_SIZES = [1, 5, 10, 25]

export default function FavoriteGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [detailData, setDetailData] = useState<Record<string, any>>({})
  const [pagination, setPagination] = useState<FavoriteGamesResult>({
    total: 0,
    page: 1,
    page_size: 10,
    list: [],
  })
  const [loading, setLoading] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const favGenResult = detailData.generatedResults?.[0]
  useShare(
    favGenResult?.game_name || '我收藏了一个游戏，快来看看',
    selectedGame && favGenResult?.record_id
      ? `/pages/detail/index?id=${favGenResult.record_id}&type=game&is_like=1`
      : '/pages/creation/index'
  )

  useEffect(() => {
    loadGames(1, 10)
  }, [])

  const loadGames = async (page: number, pageSize: number) => {
    setLoading(true)
    try {
      const data = await getFavoriteGames(page, pageSize)
      setGames(data.list)
      setPagination(data)
    } catch (error) {
      console.error('加载游戏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrev = () => {
    if (pagination.page > 1) {
      loadGames(pagination.page - 1, pagination.page_size)
    }
  }

  const handleNext = () => {
    const totalPages = Math.ceil(pagination.total / pagination.page_size)
    if (pagination.page < totalPages) {
      loadGames(pagination.page + 1, pagination.page_size)
    }
  }

  const handlePageSizeChange = (size: number) => {
    loadGames(1, size)
  }

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === games.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(games.map((g) => g.id)))
    }
  }

  const handleBatchRemove = () => {
    if (selectedIds.size === 0) return
    Taro.showModal({
      title: '提示',
      content: `确定取消收藏选中的 ${selectedIds.size} 个游戏？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await batchRemoveFavoriteGames(Array.from(selectedIds))
            setGames(games.filter((g) => !selectedIds.has(g.id)))
            setSelectedIds(new Set())
            setIsManageMode(false)
            Taro.showToast({ title: result.message || '取消收藏成功', icon: 'success' })
            loadGames(pagination.page, pagination.page_size)
          } catch (error) {
            console.error('批量取消收藏失败:', error)
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      },
    })
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

  const handleGameClick = async (game: Game) => {
    try {
      setSelectedGameId(game.id)
      const detail = await getGameDetail(game.id)
      if (!detail) {
        Taro.showToast({ title: '加载失败', icon: 'none' })
        return
      }
      setSelectedGame(detail)
      setDetailData({
        age: detail.age,
        gameType: detail.game_type,
        generatedResults: [
          {
            record_id: detail.record_id,
            age: detail.age,
            game_type: detail.game_type,
            game_name: detail.game_name,
            generated_content: detail.generated_content,
            music: detail.music,
            created_at: detail.collected_at,
          },
        ],
      })
    } catch (error) {
      console.error('加载游戏详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  const handleBack = () => {
    if (selectedGame) {
      setSelectedGame(null)
      setSelectedGameId(null)
      setDetailData({})
    } else {
      Taro.navigateBack()
    }
  }

  const handleUnfavorite = async () => {
    if (!selectedGameId) return
    try {
      await removeFavoriteGame(selectedGameId)
      setGames(games.filter((g) => g.id !== selectedGameId))
      setSelectedGame(null)
      setSelectedGameId(null)
      setDetailData({})
      Taro.showToast({ title: '已取消收藏', icon: 'success' })
    } catch (error) {
      console.error('取消收藏失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.page_size)

  if (selectedGame) {
    const genResult = detailData.generatedResults?.[0]

    const actions: ActionConfig[] = [
      { key: 'collect', type: 'collect', liked: true, onConfirm: handleUnfavorite },
      {
        key: 'share',
        type: 'share-image',
        shareData: genResult
          ? {
              gameName: genResult.game_name || '游戏',
              gameType: genResult.game_type || detailData.gameType || '团队游戏',
              age: genResult.age || detailData.age || 6,
              content: genResult.generated_content || '',
            }
          : undefined,
      },
    ]

    return (
      <Layout
        title="游戏详情"
        showTabBar={false}
        renderLeft={
          <View onClick={handleBack}>
            <ArrowLeft />
          </View>
        }
      >
        <ResultPreview
          config={RESULT_CONFIG}
          value={detailData}
          onChange={(newData) => setDetailData((prev) => ({ ...prev, ...newData }))}
        />
        <ActionBar actions={actions} />
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
      <View className="bg-gray-1 min-h-screen pb-36">
        {loading ? (
          <View className="flex flex-col items-center justify-center pt-24">
            <View className="w-10 h-10 border-4 border-orange-6 border-t-orange-2 rounded-full"></View>
            <Text className="text-sm text-gray-5 mt-4">加载中...</Text>
          </View>
        ) : games.length > 0 ? (
          <View className="p-4">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-sm text-gray-6">共 {pagination.total} 个收藏</Text>
              <View className="px-3 py-1 rounded-full bg-orange-1" onClick={toggleManageMode}>
                <Text className="text-sm text-orange-6 font-medium">
                  {isManageMode ? '取消' : '管理'}
                </Text>
              </View>
            </View>
            {games.map((game) => (
              <View key={game.id} className="flex items-start gap-2 mb-3">
                {isManageMode && (
                  <View className="flex items-center pt-4 pl-2">
                    <Checkbox
                      checked={selectedIds.has(game.id)}
                      onChange={(val) => {
                        toggleSelect(game.id)
                      }}
                    />
                  </View>
                )}
                <View className="flex-1 min-w-0">
                  <Card onClick={isManageMode ? undefined : () => handleGameClick(game)}>
                    <View className="px-4 py-3">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-base font-semibold text-gray-10 truncate">
                          {game.game_name}
                        </Text>
                        {!isManageMode && (
                          <Text
                            className="text-sm text-red flex-shrink-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemove(game.id)
                            }}
                          >
                            删除
                          </Text>
                        )}
                      </View>
                      <View className="flex gap-4">
                        <Text className="text-xs text-gray-7">{game.age}岁</Text>
                        <View className="px-2 py-1 bg-orange-1 rounded-full">
                          <Text className="text-xs text-orange-6">{game.game_type}</Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="flex flex-col items-center justify-center pt-24">
            <Star color="#c9cdd4" size={48} />
            <Text className="text-base text-gray-5 mt-4">暂无收藏游戏</Text>
          </View>
        )}
      </View>

      <View className="fixed bottom-0 left-0 right-0 z-50">
        <View className="bg-white border-t border-gray-2 py-4 px-6">
          {isManageMode ? (
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === games.length && games.length > 0}
                  onChange={toggleSelectAll}
                />
                <Text className="text-sm text-gray-8">全选</Text>
              </View>
              <View
                className="px-6 py-2 rounded-full"
                style={{
                  backgroundColor: selectedIds.size > 0 ? '#ff9500' : '#e5e5e5',
                }}
                onClick={handleBatchRemove}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: selectedIds.size > 0 ? '#ffffff' : '#999999',
                  }}
                >
                  取消收藏({selectedIds.size})
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex flex-col items-center justify-center gap-3">
              <View className="flex items-center gap-2">
                <View
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50"
                  onClick={handlePrev}
                  style={{ opacity: pagination.page === 1 ? 0.4 : 1 }}
                >
                  <ArrowLeft className="w-4 h-4 text-gray-7" />
                </View>

                <View className="flex items-center gap-1">
                  <Text className="text-base font-semibold text-gray-9">{pagination.page}</Text>
                  <Text className="text-xs text-gray-4">/</Text>
                  <Text className="text-sm text-gray-5">{totalPages}</Text>
                </View>

                <View
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50"
                  onClick={handleNext}
                  style={{ opacity: pagination.page === totalPages ? 0.4 : 1 }}
                >
                  <ArrowRight className="w-4 h-4 text-gray-7" />
                </View>
              </View>

              <View className="flex items-center gap-1">
                <Text className="text-xs text-gray-6">每页</Text>
                {PAGE_SIZES.map((size) => (
                  <View
                    key={size}
                    className="px-3 py-1 rounded-md"
                    style={{
                      backgroundColor: pagination.page_size === size ? '#ff9500' : '#f5f5f5',
                    }}
                    onClick={() => handlePageSizeChange(size)}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{
                        color: pagination.page_size === size ? '#ffffff' : '#666666',
                      }}
                    >
                      {size}
                    </Text>
                  </View>
                ))}
                <Text className="text-xs text-gray-4 ml-1">共{pagination.total}条</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Layout>
  )
}
