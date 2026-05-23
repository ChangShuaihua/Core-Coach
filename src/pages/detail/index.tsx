import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getGameDetailById } from '@/api/creation-list'
import GameDetail from '@/components/GameDetail'
import Layout from '@/components/Layout'
import type { Game } from '@/types/creation'

export default function DetailPage() {
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = router.params || {}
    const id = params.id
    const type = params.type || 'game'

    if (type === 'game' && id) {
      fetchGameDetail(id)
    }
  }, [])

  const fetchGameDetail = async (id: string) => {
    try {
      setLoading(true)
      const data = await getGameDetailById({ id })
      setGame(data)
    } catch (error) {
      console.error('加载详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="加载中..." showTabBar={false}>
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <Text style={{ fontSize: '14px', color: '#9ca3af' }}>加载中...</Text>
        </View>
      </Layout>
    )
  }

  if (!game) {
    return (
      <Layout title="错误" showTabBar={false}>
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <Text style={{ fontSize: '14px', color: '#9ca3af' }}>未找到游戏数据</Text>
        </View>
      </Layout>
    )
  }

  return <GameDetail game={game} />
}
