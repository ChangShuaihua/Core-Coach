import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, Star, Clock, User, Failure } from '@nutui/icons-react-taro'
import Layout from '@/components/Layout'

interface Game {
  id: number
  name: string
  description: string
  cover: string
  duration: string
  players: number
  category: string
}

const mockGames: Game[] = [
  {
    id: 1,
    name: '数字猜猜乐',
    description: '通过提问猜测数字',
    cover: '',
    duration: '10分钟',
    players: 2,
    category: '益智类',
  },
  {
    id: 2,
    name: '词语接龙',
    description: '根据词语最后一字接龙',
    cover: '',
    duration: '15分钟',
    players: 4,
    category: '语言类',
  },
  {
    id: 3,
    name: '你画我猜',
    description: '通过绘画猜词语',
    cover: '',
    duration: '20分钟',
    players: 4,
    category: '创意类',
  },
]

export default function FavoriteGamesPage() {
  const [games, setGames] = useState<Game[]>(mockGames)

  const handleRemove = (id: number) => {
    Taro.showModal({
      title: '提示',
      content: '确定取消收藏？',
      success: (res) => {
        if (res.confirm) {
          setGames(games.filter((g) => g.id !== id))
          Taro.showToast({ title: '已取消', icon: 'success' })
        }
      },
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
      <View style={{ minHeight: '100vh', backgroundColor: '#f7f8fa', padding: '16px' }}>
        {games.length > 0 ? (
          <View>
            <Text style={{ color: '#86909c', fontSize: '14px', marginBottom: '16px' }}>
              共 {games.length} 个收藏
            </Text>
            {games.map((game) => (
              <View
                key={game.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                }}
              >
                <View
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1d2129' }}>
                    {game.name}
                  </Text>
                  <View onClick={() => handleRemove(game.id)}>
                    <Failure color="#ff6b6b" size={16} />
                  </View>
                </View>
                <Text style={{ color: '#a9aeb8', fontSize: '14px', marginBottom: '8px' }}>
                  {game.description}
                </Text>
                <View style={{ display: 'flex', gap: '16px' }}>
                  <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock color="#6b7785" size={12} />
                    <Text style={{ color: '#6b7785', fontSize: '12px' }}>{game.duration}</Text>
                  </View>
                  <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User color="#6b7785" size={12} />
                    <Text style={{ color: '#6b7785', fontSize: '12px' }}>{game.players}人</Text>
                  </View>
                  <View
                    style={{ padding: '2px 6px', backgroundColor: '#fff3eb', borderRadius: '10px' }}
                  >
                    <Text style={{ color: '#fe6601', fontSize: '12px' }}>{game.category}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '100px',
            }}
          >
            <Star color="#c9cdd4" size={48} />
            <Text style={{ color: '#a9aeb8', fontSize: '16px', marginTop: '16px' }}>
              暂无收藏游戏
            </Text>
          </View>
        )}
      </View>
    </Layout>
  )
}
