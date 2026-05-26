import { View, Text } from '@tarojs/components'
import type { Round } from '@/utils/gameParser'

interface GameTimelineProps {
  rounds: Round[]
}

export default function GameTimeline({ rounds }: GameTimelineProps) {
  if (rounds.length === 0) return null

  return (
    <View style={{ marginBottom: '24px' }}>
      <Text
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '12px',
          display: 'block',
        }}
      >
        🎯 游戏大纲
      </Text>
      <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rounds.map((round, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #f3f4f6',
            }}
          >
            <Text
              style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#f97316',
                marginBottom: '10px',
                display: 'block',
              }}
            >
              🚀 {round.title}
            </Text>
            {round.props && (
              <View style={{ marginBottom: '8px' }}>
                <Text style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                  🧸 所需道具：
                </Text>
                <Text style={{ fontSize: '14px', color: '#374151', lineHeight: '20px' }}>
                  {round.props}
                </Text>
              </View>
            )}
            {round.rule && (
              <View style={{ marginBottom: '8px' }}>
                <Text style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                  📖 规则简述：
                </Text>
                <Text style={{ fontSize: '14px', color: '#374151', lineHeight: '20px' }}>
                  {round.rule}
                </Text>
              </View>
            )}
            {round.safety && (
              <View>
                <Text style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                  ⚠️ 安全提醒：
                </Text>
                <Text style={{ fontSize: '14px', color: '#dc2626', lineHeight: '20px' }}>
                  {round.safety}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}
