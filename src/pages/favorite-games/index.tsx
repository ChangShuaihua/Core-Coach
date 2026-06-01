import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { Checkbox } from '@nutui/nutui-react-taro'
import { getFavoriteGames, removeFavoriteGame, batchRemoveFavoriteGames } from '@/api/profile'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import PaginatedList from '@/components/PaginatedList'
import type { Game } from '@/types/game'

const PAGE_SIZE = 20

export default function FavoriteGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const pageRef = useRef(1)

  const hasMore = games.length < total

  const loadGames = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true)
    try {
      const data = await getFavoriteGames(pageNum, PAGE_SIZE)
      setGames((prev) => (append ? [...prev, ...data.list] : data.list))
      setTotal(data.total)
      pageRef.current = data.page
    } catch (error) {
      console.error('加载游戏失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGames(1, false)
  }, [])

  const handleLoadMore = useCallback(async () => {
    await loadGames(pageRef.current + 1, true)
  }, [loadGames])

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === games.length ? new Set() : new Set(games.map((g) => g.id)))
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
            Taro.showToast({ title: result.message || '取消收藏成功', icon: 'success' })
            setSelectedIds(new Set())
            setIsManageMode(false)
            pageRef.current = 1
            loadGames(1, false)
          } catch {
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
          } catch {
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleGameClick = (game: Game) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${game.record_id}&type=game&is_like=1`,
    })
  }

  return (
    <Layout
      title="收藏游戏"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <PaginatedList
        items={games}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        emptyText="暂无收藏游戏"
        showBackTop={!isManageMode}
        renderHeader={() => (
          <View className="flex items-center justify-between p-4 pb-0">
            <Text className="text-sm text-gray-6">共 {total} 个收藏</Text>
            <View className="px-3 py-1 rounded-full bg-orange-1" onClick={toggleManageMode}>
              <Text className="text-sm text-orange-6 font-medium">
                {isManageMode ? '取消' : '管理'}
              </Text>
            </View>
          </View>
        )}
        renderItem={(game) => (
          <View key={game.id} className="flex items-start gap-2 mb-3">
            {isManageMode && (
              <View className="flex items-center pt-4 pl-2">
                <Checkbox
                  checked={selectedIds.has(game.id)}
                  onChange={() => toggleSelect(game.id)}
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
        )}
      />
      {isManageMode && (
        <View className="fixed bottom-0 left-0 right-0 z-50">
          <View className="bg-white border-t border-gray-2 py-4 px-6">
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
          </View>
        </View>
      )}
    </Layout>
  )
}
