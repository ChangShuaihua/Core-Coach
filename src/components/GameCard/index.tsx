import type { ReactNode } from 'react'
import { View, Text } from '@tarojs/components'
import { Star, StarFill } from '@nutui/icons-react-taro'
import Card from '@/components/Card'

interface GameCardProps {
  title: string
  age?: number
  gameType?: string
  extra?: string
  favorited?: boolean
  onToggleFavorite?: () => void
  rightSlot?: ReactNode
  onClick?: () => void
  className?: string
}

export default function GameCard({
  title,
  age,
  gameType,
  extra,
  favorited,
  onToggleFavorite,
  rightSlot,
  onClick,
  className,
}: GameCardProps) {
  return (
    <Card className={className} onClick={onClick}>
      <View className="px-4 py-3">
        <View className="flex items-start gap-3">
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
          <View className="flex-1 min-w-0">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-base font-semibold text-gray-10 truncate">{title}</Text>
              <View className="flex items-center gap-2 flex-shrink-0 ml-2">
                {favorited !== undefined && (
                  <View
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite?.()
                    }}
                    onTap={(e) => {
                      e.stopPropagation()
                      onToggleFavorite?.()
                    }}
                  >
                    {favorited ? (
                      <StarFill size="18" color="#ff9500" />
                    ) : (
                      <Star size="18" color="#d1d5db" />
                    )}
                  </View>
                )}
                {rightSlot}
              </View>
            </View>
            <View className="flex gap-4">
              {extra && <Text className="text-xs text-gray-5">{extra}</Text>}
              {age !== undefined && <Text className="text-xs text-gray-7">{age}岁</Text>}
              {gameType && (
                <View className="px-2 py-1 bg-orange-1 rounded-full">
                  <Text className="text-xs text-orange-6">{gameType}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Card>
  )
}
