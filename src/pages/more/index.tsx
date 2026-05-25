import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { getCreationList } from '@/api/creation-list'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import type { CreationListItem } from '@/types/creation-list'

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const iconMap: Record<string, string> = {
  game: '🎮',
  lesson: '📋',
}

export default function MorePage() {
  const [filter, setFilter] = useState<'all' | 'game' | 'lesson'>('all')
  const [list, setList] = useState<CreationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setPage(1)
    setList([])
    fetchData(1, filter)
  }, [filter])

  const fetchData = async (pageNum: number, type?: string) => {
    try {
      setLoading(true)
      const params: Record<string, string> = {
        page: String(pageNum),
        page_size: '10',
      }
      if (type && type !== 'all') {
        params.type = type
      }
      const res = await getCreationList(params)
      const newList = res.list || []
      if (pageNum === 1) {
        setList(newList)
      } else {
        setList((prev) => [...prev, ...newList])
      }
      setHasMore(newList.length >= 10)
      setPage(pageNum)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchData(page + 1, filter)
    }
  }

  const filteredList = list

  const tabs = [
    { key: 'all' as const, label: '全部' },
    { key: 'game' as const, label: '游戏' },
    { key: 'lesson' as const, label: '教案' },
  ]

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
      <View style={{ padding: '16px' }}>
        {/* 筛选标签 */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginBottom: '16px' }}>
          {tabs.map((tab) => (
            <View
              key={tab.key}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                backgroundColor: filter === tab.key ? '#f97316' : '#f3f4f6',
                cursor: 'pointer',
              }}
              onClick={() => setFilter(tab.key)}
            >
              <Text
                style={{
                  fontSize: '14px',
                  color: filter === tab.key ? '#ffffff' : '#6b7280',
                  fontWeight: filter === tab.key ? '600' : '400',
                }}
              >
                {tab.label}
              </Text>
            </View>
          ))}
        </View>

        {/* 加载状态 */}
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
            {filteredList.map((item) => (
              <Card
                key={item.id}
                className="p-4"
                onClick={() =>
                  Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}&type=${item.type}` })
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
                      backgroundColor: item.type === 'game' ? '#fff7ed' : '#eff6ff',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontSize: '24px' }}>{iconMap[item.type] || '📄'}</Text>
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
                    <Text
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: '14px', color: '#9ca3af' }}>›</Text>
                </View>
              </Card>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <View
                style={{ textAlign: 'center', padding: '16px 0', cursor: 'pointer' }}
                onClick={loadMore}
              >
                <Text style={{ fontSize: '14px', color: '#f97316' }}>
                  {loading ? '加载中...' : '加载更多'}
                </Text>
              </View>
            )}
            {!hasMore && filteredList.length > 0 && (
              <View style={{ textAlign: 'center', padding: '16px 0' }}>
                <Text style={{ fontSize: '12px', color: '#9ca3af' }}>没有更多了</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Layout>
  )
}
