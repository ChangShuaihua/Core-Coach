import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { getRecentCreations } from '@/api/more'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { getGameConfig } from '@/types/creation'
import type { RecentCreation } from '@/types/creation-list'
import { formatTime, isToday, isWithinDays, matchAge } from '@/utils/date'

const TIME_TABS = [
  { key: 'all' as const, label: '全部' },
  { key: 'today' as const, label: '今天' },
  { key: 'week' as const, label: '近7天' },
]

const AGE_TABS = [
  { key: 'all' as const, label: '全部' },
  { key: '3-4' as const, label: '3-4岁' },
  { key: '5-6' as const, label: '5-6岁' },
  { key: '7-8' as const, label: '7-8岁' },
  { key: '9+' as const, label: '9岁+' },
]

const PAGE_BATCH = 20

export default function MorePage() {
  const [gameTypeFilter, setGameTypeFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all')
  const [ageFilter, setAgeFilter] = useState<'all' | '3-4' | '5-6' | '7-8' | '9+'>('all')
  const [allList, setAllList] = useState<RecentCreation[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(PAGE_BATCH)
  const [loadingMore, setLoadingMore] = useState(false)
  const [gameTypeTabs, setGameTypeTabs] = useState<Array<{ key: string; label: string }>>([
    { key: 'all', label: '全部' },
  ])

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getRecentCreations()
      setAllList(data)
      setDisplayCount(PAGE_BATCH)
    } catch (error) {
      console.error('加载失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
    getGameConfig().then((res) => {
      const types = res.game_type_options
        .filter((t) => t.status === 1)
        .map((t) => ({ key: t.name, label: t.name }))
      setGameTypeTabs([{ key: 'all', label: '全部' }, ...types])
    })
  }, [])

  // 筛选条件变化时重置显示数量
  useEffect(() => {
    setDisplayCount(PAGE_BATCH)
  }, [gameTypeFilter, timeFilter, ageFilter])

  const filteredList = allList.filter((item) => {
    if (gameTypeFilter !== 'all' && item.game_type !== gameTypeFilter) return false
    if (timeFilter === 'today' && !isToday(item.created_at)) return false
    if (timeFilter === 'week' && !isWithinDays(item.created_at, 7)) return false
    if (ageFilter !== 'all' && (item.age === undefined || !matchAge(item.age, ageFilter)))
      return false
    return true
  })

  const renderList = filteredList.slice(0, displayCount)
  const hasMore = displayCount < filteredList.length

  const handleScrollToLower = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true)
      setTimeout(() => {
        setDisplayCount((prev) => Math.min(prev + PAGE_BATCH, filteredList.length))
        setLoadingMore(false)
      }, 300)
    }
  }

  return (
    <Layout
      title="全部创作"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <ScrollView scrollY style={{ height: '100%' }} onScrollToLower={handleScrollToLower}>
        <View style={{ padding: '16px' }}>
          {/* 时间筛选 */}
          <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginBottom: '12px' }}>
            {TIME_TABS.map((tab) => (
              <View
                key={tab.key}
                style={{
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  backgroundColor: timeFilter === tab.key ? '#f97316' : '#f3f4f6',
                }}
                onClick={() => setTimeFilter(tab.key)}
              >
                <Text
                  style={{
                    fontSize: '13px',
                    color: timeFilter === tab.key ? '#ffffff' : '#6b7280',
                    fontWeight: timeFilter === tab.key ? '600' : '400',
                  }}
                >
                  {tab.label}
                </Text>
              </View>
            ))}
          </View>

          {/* 游戏类型筛选 */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '8px',
              marginBottom: '12px',
              flexWrap: 'wrap',
            }}
          >
            {gameTypeTabs.map((tab) => (
              <View
                key={tab.key}
                style={{
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  backgroundColor: gameTypeFilter === tab.key ? '#f97316' : '#f3f4f6',
                }}
                onClick={() => setGameTypeFilter(tab.key)}
              >
                <Text
                  style={{
                    fontSize: '13px',
                    color: gameTypeFilter === tab.key ? '#ffffff' : '#6b7280',
                    fontWeight: gameTypeFilter === tab.key ? '600' : '400',
                  }}
                >
                  {tab.label}
                </Text>
              </View>
            ))}
          </View>

          {/* 年龄筛选 */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            {AGE_TABS.map((tab) => (
              <View
                key={tab.key}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: ageFilter === tab.key ? '#f97316' : '#f3f4f6',
                }}
                onClick={() => setAgeFilter(tab.key)}
              >
                <Text
                  style={{
                    fontSize: '13px',
                    color: ageFilter === tab.key ? '#ffffff' : '#6b7280',
                    fontWeight: ageFilter === tab.key ? '600' : '400',
                  }}
                >
                  {tab.label}
                </Text>
              </View>
            ))}
          </View>

          {/* 列表 */}
          {loading ? (
            <View style={{ textAlign: 'center', paddingTop: '60px' }}>
              <Text style={{ fontSize: '14px', color: '#9ca3af' }}>加载中...</Text>
            </View>
          ) : filteredList.length === 0 ? (
            <View style={{ textAlign: 'center', paddingTop: '60px' }}>
              <Text style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📭</Text>
              <Text style={{ fontSize: '14px', color: '#9ca3af' }}>暂无创作记录</Text>
            </View>
          ) : (
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {renderList.map((item) => (
                <Card
                  key={item.id}
                  className="p-4"
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/detail/index?id=${item.id}&type=${item.type}`,
                    })
                  }
                >
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <View
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#fff7ed',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: '24px' }}>🎮</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: '#111827',
                          display: 'block',
                        }}
                      >
                        {item.title}
                      </Text>
                      <View
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                      >
                        <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {formatTime(item.created_at)}
                        </Text>
                        {item.age !== undefined && (
                          <Text style={{ fontSize: '12px', color: '#f97316' }}>{item.age}岁</Text>
                        )}
                        {item.game_type && (
                          <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                            {item.game_type}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text style={{ fontSize: '14px', color: '#9ca3af' }}>›</Text>
                  </View>
                </Card>
              ))}

              {/* 加载状态 */}
              {hasMore ? (
                <View style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Text style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {loadingMore ? '加载中...' : '上滑加载更多'}
                  </Text>
                </View>
              ) : (
                <View style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
                    没有更多了（共 {filteredList.length} 条）
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Layout>
  )
}
