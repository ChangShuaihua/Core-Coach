import { View, Text, Picker } from '@tarojs/components'

export interface GameTypeSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  options?: string[]
}

/**
 * GameTypeSelector - 游戏类型选择器组件
 *
 * 用于选择游戏类型或分类
 */
export default function GameTypeSelector({
  value,
  onChange,
  label = '游戏类型',
  required = false,
  options = ['体能训练', '平衡协调', '团队合作', '反应速度', '创意探索', '综合训练'],
}: GameTypeSelectorProps) {
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
            {value || '请选择游戏类型'}
          </Text>
        </View>
      </Picker>
    </View>
  )
}
