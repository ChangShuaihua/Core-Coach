import { View, Text } from '@tarojs/components'
import type { GameType } from '@/api/creation'

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
      <Text className="text-sm font-medium text-gray-700">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <View className="flex flex-wrap gap-2">
        {availableTypes.map((type) => {
          const isSelected = value === type.code
          return (
            <View
              key={type.code}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
                  : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50'
              }`}
              onClick={() => onChange(type.code)}
            >
              {type.name}
            </View>
          )
        })}
      </View>
    </View>
  )
}
