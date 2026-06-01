import type { ReactNode } from 'react'
import { View, Text } from '@tarojs/components'
import Card from '@/components/Card'

interface GameCardProps {
  title: string
  age?: number
  gameType?: string
  extra?: string
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  onClick?: () => void
  className?: string
}

export default function GameCard({
  title,
  age,
  gameType,
  extra,
  leftSlot,
  rightSlot,
  onClick,
  className,
}: GameCardProps) {
  return (
    <Card className={className} onClick={onClick}>
      <View className="px-4 py-3">
        <View className="flex items-start gap-3">
          {leftSlot}
          <View className="flex-1 min-w-0">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-base font-semibold text-gray-10 truncate">{title}</Text>
              {rightSlot && <View className="flex-shrink-0 ml-2">{rightSlot}</View>}
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
