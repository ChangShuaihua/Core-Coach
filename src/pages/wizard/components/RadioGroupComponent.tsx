import { View, Text, RadioGroup, Radio } from '@tarojs/components'
import Card from '@/components/Card'

export interface RadioGroupConfig {
  step: number
  title: string
  options: string[]
  required?: boolean
}

interface RadioGroupComponentProps {
  config: RadioGroupConfig
  value: any
  onChange: (value: string) => void
}

/**
 * RadioGroupComponent - 单选按钮组组件
 *
 * 用于处理 type: 'radio_group' 的步骤
 */
export default function RadioGroupComponent({ config, value, onChange }: RadioGroupComponentProps) {
  const fieldKey = `step_${config.step}`
  const currentValue = value[fieldKey]

  return (
    <Card className="p-6">
      <Text className="text-lg font-semibold mb-4 block">{config.title}</Text>
      <RadioGroup onChange={(e) => onChange(e.detail.value)}>
        <View className="flex flex-col gap-3">
          {config.options.map((opt) => (
            <View key={opt} className="flex items-center">
              <Radio value={opt} checked={currentValue === opt} />
              <Text className="ml-2">{opt}</Text>
            </View>
          ))}
        </View>
      </RadioGroup>
    </Card>
  )
}
