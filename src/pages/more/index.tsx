import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { getCreationList } from '@/api/more'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import PaginatedList from '@/components/PaginatedList'
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

const PAGE_SIZE = 20

const filterBarStyle = {
  display: 'flex' as const,
  flexDirection: 'row' as const,
  gap: '6px',
  marginBottom: '10px',
  flexWrap: 'wrap' as const,
  alignItems: 'center' as const,
}

const pillStyle = (active: boolean) => ({
  padding: '4px 12px',
  borderRadius: '9999px',
  backgroundColor: active ? '#f97316' : '#f3f4f6',
})

const pillTextStyle = (active: boolean) => ({
  fontSize: '12px',
  color: active ? '#ffffff' : '#6b7280',
  fontWeight: active ? ('600' as const) : ('400' as const),
})

export default function MorePage() {
  const [gameTypeFilter, setGameTypeFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all')
  const [ageFilter, setAgeFilter] = useState<'all' | '3-4' | '5-6' | '7-8' | '9+'>('all')
  const [list, setList] = useState<RecentCreation[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const pageRef = useRef(1)
  const [gameTypeTabs, setGameTypeTabs] = useState<Array<{ key: string; label: string }>>([
    { key: 'all', label: '全部' },
  ])

  const hasMore = list.length < total

  const fetchData = useCallback(async (pageNum: number, append: boolean) => {
    try {
      setLoading(true)
      const res = await getCreationList({ page: pageNum, page_size: PAGE_SIZE })
      setList((prev) => (append ? [...prev, ...res.list] : res.list))
      setTotal(res.total)
      pageRef.current = res.page
    } catch (error) {
      console.error('加载失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(1, false)
    getGameConfig().then((res) => {
      const types = res.game_type_options
        .filter((t) => t.status === 1)
        .map((t) => ({ key: t.name, label: t.name }))
      setGameTypeTabs([{ key: 'all', label: '全部' }, ...types])
    })
  }, [])

  // 筛选条件变化 → 清空 + page=1 重新请求
  useEffect(() => {
    setList([])
    setTotal(0)
    pageRef.current = 1
    fetchData(1, false)
  }, [gameTypeFilter, timeFilter, ageFilter])

  const handleLoadMore = useCallback(async () => {
    await fetchData(pageRef.current + 1, true)
  }, [fetchData])

  const filteredList = list.filter((item) => {
    if (gameTypeFilter !== 'all' && item.game_type !== gameTypeFilter) return false
    if (timeFilter === 'today' && !isToday(item.created_at)) return false
    if (timeFilter === 'week' && !isWithinDays(item.created_at, 7)) return false
    if (ageFilter !== 'all' && (item.age === undefined || !matchAge(item.age, ageFilter)))
      return false
    return true
  })

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
      <PaginatedList
        items={filteredList}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        emptyText="暂无创作记录"
        renderHeader={() => (
          <View style={{ padding: '12px', paddingBottom: 0 }}>
            <View style={filterBarStyle}>
              {TIME_TABS.map((tab) => (
                <View
                  key={tab.key}
                  style={pillStyle(timeFilter === tab.key)}
                  onClick={() => setTimeFilter(tab.key)}
                >
                  <Text style={pillTextStyle(timeFilter === tab.key)}>{tab.label}</Text>
                </View>
              ))}
            </View>
            <View style={filterBarStyle}>
              <Text style={{ fontSize: '14px', color: '#6b7280', flexShrink: 0 }}>活动模式:</Text>
              {gameTypeTabs.map((tab) => (
                <View
                  key={tab.key}
                  style={pillStyle(gameTypeFilter === tab.key)}
                  onClick={() => setGameTypeFilter(tab.key)}
                >
                  <Text style={pillTextStyle(gameTypeFilter === tab.key)}>{tab.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ ...filterBarStyle, marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', color: '#6b7280', flexShrink: 0 }}>适用年龄:</Text>
              {AGE_TABS.map((tab) => (
                <View
                  key={tab.key}
                  style={pillStyle(ageFilter === tab.key)}
                  onClick={() => setAgeFilter(tab.key)}
                >
                  <Text style={pillTextStyle(ageFilter === tab.key)}>{tab.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        renderItem={(item) => (
          <Card
            key={item.id}
            className="p-4 mb-3"
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
                    <Text style={{ fontSize: '12px', color: '#6b7280' }}>{item.game_type}</Text>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: '14px', color: '#9ca3af' }}>›</Text>
            </View>
          </Card>
        )}
      />
    </Layout>
  )
}
