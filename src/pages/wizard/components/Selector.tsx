import { View, Text, RadioGroup, Radio, CheckboxGroup, Checkbox, Image } from '@tarojs/components'
import Card from '@/components/Card'

export interface SelectorOption {
  label: string
  value: string
  icon?: string
}

export interface SelectorConfig {
  step: number
  title: string
  options: string[] | SelectorOption[]
  multiple?: boolean
  maxSelect?: number
  required?: boolean
}

interface SelectorProps {
  config: SelectorConfig
  value: any
  onChange: (value: any) => void
}

/**
 * Selector - 单选/多选组件
 *
 * 用于处理 type: 'selector' 的步骤
 * 支持简单字符串数组或对象数组格式
 */
export default function Selector({ config, value, onChange }: SelectorProps) {
  const fieldKey = `step_${config.step}`
  const currentValue = value[fieldKey]

  // 标准化选项格式
  const normalizedOptions: SelectorOption[] = config.options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt }
    }
    return opt
  })

  if (config.multiple) {
    return (
      <Card className="p-6">
        <Text className="text-lg font-semibold mb-4 block">{config.title}</Text>
        <CheckboxGroup onChange={(e) => onChange(e.detail.value)}>
          <View className="flex flex-col gap-3">
            {normalizedOptions.map((opt) => (
              <View key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  value={opt.value}
                  checked={Array.isArray(currentValue) && currentValue.includes(opt.value)}
                />
                {opt.icon && (
                  <Image
                    src={opt.icon}
                    className="w-10 h-10 object-cover rounded"
                    mode="aspectFit"
                  />
                )}
                <Text className="ml-2">{opt.label}</Text>
              </View>
            ))}
          </View>
        </CheckboxGroup>
        {config.maxSelect && (
          <Text className="text-xs text-gray-500 mt-2">
            最多可选 {config.maxSelect} 项，已选{' '}
            {Array.isArray(currentValue) ? currentValue.length : 0} 项
          </Text>
        )}
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <Text className="text-lg font-semibold mb-4 block">{config.title}</Text>
      <RadioGroup onChange={(e) => onChange(e.detail.value)}>
        <View className="flex flex-col gap-3">
          {normalizedOptions.map((opt) => (
            <View key={opt.value} className="flex items-center gap-2">
              <Radio value={opt.value} checked={currentValue === opt.value} />
              {opt.icon && (
                <Image src={opt.icon} className="w-10 h-10 object-cover rounded" mode="aspectFit" />
              )}
              <Text className="ml-2">{opt.label}</Text>
            </View>
          ))}
        </View>
      </RadioGroup>
    </Card>
  )
}
