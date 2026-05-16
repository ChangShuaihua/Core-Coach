import { View, Text, Slider } from '@tarojs/components'
import Card from '@/components/Card'

export interface SliderConfig {
  step: number
  title: string
  min?: number
  max?: number
  default?: number
  required?: boolean
}

interface SliderComponentProps {
  config: SliderConfig
  value: any
  onChange: (value: number) => void
}

/**
 * SliderComponent - 滑动条组件
 *
 * 用于处理 type: 'slider' 的步骤
 */
export default function SliderComponent({ config, value, onChange }: SliderComponentProps) {
  const fieldKey = `step_${config.step}`
  const currentValue = value[fieldKey] ?? config.default ?? 0
  const min = config.min ?? 0
  const max = config.max ?? 100

  return (
    <Card className="p-6">
      <Text className="text-lg font-semibold mb-4 block">{config.title}</Text>
      <View className="flex items-center gap-4">
        <Slider
          value={currentValue}
          onChange={(e) => onChange(e.detail.value)}
          min={min}
          max={max}
          className="flex-1"
        />
        <Text className="text-lg font-semibold w-16 text-right">{currentValue}</Text>
      </View>
      <View className="flex justify-between mt-2 text-xs text-gray-500">
        <Text>{min}</Text>
        <Text>{max}</Text>
      </View>
    </Card>
  )
}
