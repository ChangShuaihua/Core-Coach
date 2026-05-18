import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import type { AgeConfig } from '@/api/creation'

export interface AgeSelectorProps {
  value: string // 格式："8岁"
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

  // 从 "8岁" 中提取数字部分
  const extractNumber = (val?: string): number => {
    if (!val) return min
    const match = val.match(/\d+/)
    if (!match) return min
    const num = parseInt(match[0], 10)
    if (Number.isNaN(num)) return min
    return Math.min(max, Math.max(min, num))
  }

  const [currentValue, setCurrentValue] = useState<number>(() => extractNumber(value))

  // 当外部 value 变化时同步（例如表单重置）
  useEffect(() => {
    const num = extractNumber(value)
    setCurrentValue(num)
  }, [value, min, max, extractNumber])

  // 通知外部变化
  const notifyChange = useCallback(
    (newNum: number) => {
      const newVal = `${newNum}${unit}`
      onChange(newVal)
    },
    [onChange, unit]
  )

  const handleDecrease = () => {
    if (currentValue > min) {
      const newVal = currentValue - 1
      setCurrentValue(newVal)
      notifyChange(newVal)
    }
  }

  const handleIncrease = () => {
    if (currentValue < max) {
      const newVal = currentValue + 1
      setCurrentValue(newVal)
      notifyChange(newVal)
    }
  }
  return (
    <View className="flex flex-col gap-2">
      {/* 标签 */}
      <Text className="text-sm font-medium text-gray-700">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>

      {/* 步进器容器 */}
      <View className="flex items-center gap-4">
        {/* 减号按钮 */}
        <View
          className={`w-8 h-8 flex items-center justify-center rounded-full border ${
            currentValue <= min
              ? 'border-gray-200 text-gray-300 bg-gray-50'
              : 'border-orange-500 text-orange-500 bg-orange-50'
          } transition-colors`}
          onClick={handleDecrease}
          style={{ userSelect: 'none' }}
        >
          <Text className="text-xl font-bold">−</Text>
        </View>

        {/* 数值显示 */}
        <View className="w-20 text-center">
          <Text className="text-lg font-semibold text-gray-800">
            {currentValue}
            {unit}
          </Text>
        </View>

        {/* 加号按钮 */}
        <View
          className={`w-8 h-8 flex items-center justify-center rounded-full border ${
            currentValue >= max
              ? 'border-gray-200 text-gray-300 bg-gray-50'
              : 'border-orange-500 text-orange-500 bg-orange-50'
          } transition-colors`}
          onClick={handleIncrease}
          style={{ userSelect: 'none' }}
        >
          <Text className="text-xl font-bold">+</Text>
        </View>
      </View>

      {/* 可选：显示范围提示 */}
      <Text className="text-xs text-gray-400">
        可选范围：{min}
        {unit} ~ {max}
        {unit}
      </Text>
    </View>
  )
}
