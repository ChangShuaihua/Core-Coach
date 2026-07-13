import { View, Text } from '@tarojs/components'
import type { GameType } from '@/types/creation'

export interface GameTypeSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  options?: GameType[]
}

export default function GameTypeSelector({
  value,
  onChange,
  label = '游戏类型',
  required = false,
  options = [],
}: GameTypeSelectorProps) {
  const availableTypes = options.filter((t) => t.status === 1)

  return (
    <View className="flex flex-col gap-2">
      <Text className="text-base font-blod text-black">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <View className="flex flex-wrap gap-2">
        {availableTypes.map((type) => {
          const isSelected = value === type.name
          return (
            <View
              key={type.code}
              className={`flex-1 w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                isSelected ? 'bg-orange-50 text-orange-600 font-medium' : 'bg-white text-gray-700'
              }`}
              style={{
                border: `1px solid ${isSelected ? '#FF7A2F' : '#d1d5db'}`,
              }}
              onClick={() => onChange(type.name)}
            >
              {type.name}
            </View>
          )
        })}
      </View>
    </View>
  )
}
