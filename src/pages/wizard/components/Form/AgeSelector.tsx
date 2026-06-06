import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import type { AgeConfig } from '@/types/creation'

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
  const extractNumber = useCallback(
    (val?: string): number => {
      if (!val) return min
      const match = val.match(/\d+/)
      if (!match) return min
      const num = parseInt(match[0], 10)
      if (Number.isNaN(num)) return min
      return Math.min(max, Math.max(min, num))
    },
    [max, min]
  )

  const [currentValue, setCurrentValue] = useState<number>(() => extractNumber(value))

  // 初始化时如果外部没有值，通知父组件默认值
  useEffect(() => {
    if (!value) {
      onChange(`${min}${unit}`)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <Text className="text-base font-blod text-black">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>

      {/* 步进器容器 - InputNumber 样式 */}
      <View className="flex items-center">
        <View className="flex items-center border border-orange-500 rounded-lg bg-white overflow-hidden">
          {/* 减号按钮 */}
          <View
            className={`w-10 h-10 flex items-center justify-center border-r border-orange-200 transition-colors ${
              currentValue <= min ? 'text-orange-200 bg-orange-50' : 'text-orange-600 bg-orange-50'
            }`}
            onClick={handleDecrease}
            style={{ userSelect: 'none' }}
          >
            <Text className="text-xl font-blod">−</Text>
          </View>

          {/* 数值显示 */}
          <View className="w-14 h-10 flex items-center justify-center bg-white">
            <Text className="text-base font-semibold text-block">
              {currentValue}
              {unit}
            </Text>
          </View>

          {/* 加号按钮 */}
          <View
            className={`w-10 h-10 flex items-center justify-center border-l border-orange-200 transition-colors ${
              currentValue >= max ? 'text-orange-200 bg-orange-50' : 'text-orange-600 bg-orange-50'
            }`}
            onClick={handleIncrease}
            style={{ userSelect: 'none' }}
          >
            <Text className="text-xl font-blod">+</Text>
          </View>
        </View>

        {/* 右侧范围提示 */}
        <Text className="ml-3 text-sm text-gray-500">
          {min}
          {unit} ~ {max}
          {unit}
        </Text>
      </View>
    </View>
  )
}
