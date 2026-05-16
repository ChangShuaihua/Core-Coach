import { View, Text, Picker } from '@tarojs/components'

export interface PlayerCountSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  options?: string[]
}

/**
 * PlayerCountSelector - 人数选择器组件
 *
 * 用于选择参与人数范围
 */
export default function PlayerCountSelector({
  value,
  onChange,
  label = '参与人数',
  required = false,
  options = ['1-5人', '5-10人', '10-15人', '15-20人', '20-30人', '30人以上'],
}: PlayerCountSelectorProps) {
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
            {value || '请选择人数范围'}
          </Text>
        </View>
      </Picker>
    </View>
  )
}
