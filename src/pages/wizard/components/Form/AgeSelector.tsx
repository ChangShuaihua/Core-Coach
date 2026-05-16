import { View, Text, Picker } from '@tarojs/components'

export interface AgeSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  options?: string[]
}

/**
 * AgeSelector - 年龄选择器组件
 *
 * 用于选择适合的年龄段
 */
export default function AgeSelector({
  value,
  onChange,
  label = '适合年龄',
  required = false,
  options = ['2-3岁', '3-4岁', '4-5岁', '5-6岁', '6-7岁', '7-8岁', '8-10岁', '10-12岁'],
}: AgeSelectorProps) {
  const handlePickerChange = (e: any) => {
    const selectedValue = options[e.detail.value]
    onChange(selectedValue)
  }

  return (
    <View className="flex flex-col gap-2">
      <Text className="text-sm font-medium text-gray-700">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <Picker
        mode="selector"
        range={options}
        value={options.indexOf(value || '')}
        onChange={handlePickerChange}
      >
        <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white">
          <Text className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value || '请选择年龄段'}
          </Text>
        </View>
      </Picker>
    </View>
  )
}
