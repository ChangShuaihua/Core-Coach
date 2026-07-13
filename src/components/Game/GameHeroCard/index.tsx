import { View, Text } from '@tarojs/components'
import { getGameEmoji } from '@/utils/gameParser'

interface GameHeroCardProps {
  name: string
  tag: string
  age?: number | string
  playerCount?: string
  gameType?: string
}

export default function GameHeroCard({ name, tag, age, playerCount, gameType }: GameHeroCardProps) {
  const emoji = getGameEmoji(tag)

  return (
    <View
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景emoji装饰 */}
      <Text
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-5px',
          fontSize: '80px',
          opacity: 0.08,
          lineHeight: '1',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {emoji}
      </Text>

      {/* 标题+Tag */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <Text
          style={{
            flex: 1,
            paddingRight: '16px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827',
          }}
        >
          {name}
        </Text>
        <View
          style={{
            backgroundColor: '#fff7ed',
            padding: '4px 10px',
            borderRadius: '9999px',
            border: '1px solid #ffedd5',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: '14px', color: '#ea580c', fontWeight: '500' }}>{tag}</Text>
        </View>
      </View>

      {/* 基础配置 */}
      <View>
        <Text
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '12px',
            display: 'block',
          }}
        >
          基础配置
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            borderBottom: '1px solid #f3f4f6',
            paddingBottom: '16px',
          }}
        >
          <View
            style={{ width: '50%', display: 'flex', flexDirection: 'row', marginBottom: '12px' }}
          >
            <Text style={{ fontSize: '14px', color: '#6b7280' }}>适合年龄：</Text>
            <Text style={{ fontSize: '14px', color: '#f97316', fontWeight: '500' }}>
              {age ? `${age}岁` : '6-10岁'}
            </Text>
          </View>
          <View
            style={{ width: '50%', display: 'flex', flexDirection: 'row', marginBottom: '12px' }}
          >
            <Text style={{ fontSize: '14px', color: '#6b7280' }}>参与人数：</Text>
            <Text style={{ fontSize: '14px', color: '#f97316', fontWeight: '500' }}>
              {playerCount || '10-20人'}
            </Text>
          </View>
          <View
            style={{ width: '50%', display: 'flex', flexDirection: 'row', marginBottom: '4px' }}
          >
            <Text style={{ fontSize: '14px', color: '#6b7280' }}>游戏类型：</Text>
            <Text style={{ fontSize: '14px', color: '#f97316', fontWeight: '500' }}>
              {gameType || '循环式'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
