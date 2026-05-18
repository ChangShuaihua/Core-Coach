import { View, Text } from '@tarojs/components'
import type { AgeConfig } from '@/api/creation'

export interface AgeSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  config?: AgeConfig
}

export default function AgeSelector({
  value,
  onChange,
  label = '适合年龄',
  required = false,
  config,
}: AgeSelectorProps) {
  const min = config?.min ?? 3
  const max = config?.max ?? 12
  const unit = config?.unit ?? '岁'

  const options: string[] = []
  for (let i = min; i <= max; i++) {
    options.push(`${i}${unit}`)
  }

  return (
    <View className="flex flex-col gap-2">
      <Text className="text-sm font-medium text-gray-700">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <View className="flex flex-wrap gap-2">
        {options.map((age) => {
          const isSelected = value === age
          return (
            <View
              key={age}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
                  : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50'
              }`}
              onClick={() => onChange(age)}
            >
              {age}
            </View>
          )
        })}
      </View>
    </View>
  )
}
