import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'

export interface PlayerCountSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  options?: string[]
}

export default function PlayerCountSelector({
  value,
  onChange,
  label = '参与人数',
  required = false,
  options = ['1-30人'],
}: PlayerCountSelectorProps) {
  // 解析最小最大值
  const parseMinMax = (optStr: string) => {
    const match = optStr.match(/(\d+)-(\d+)/)
    if (match) {
      return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) }
    }
    return { min: 1, max: 30 }
  }

  const { min, max } = parseMinMax(options[0] || '1-30人')

  const [count, setCount] = useState<number>(() => {
    const parsed = parseInt(value, 10)
    return Number.isNaN(parsed) ? min : parsed
  })

  // 初始化时如果外部没有值，通知父组件默认值
  useEffect(() => {
    if (!value) {
      onChange(String(min))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed) && parsed !== count) {
      setCount(parsed)
    }
  }, [value, count])

  const handleIncrease = () => {
    if (count < max) {
      const newVal = count + 1
      setCount(newVal)
      onChange(String(newVal))
    }
  }

  const handleDecrease = () => {
    if (count > min) {
      const newVal = count - 1
      setCount(newVal)
      onChange(String(newVal))
    }
  }

  return (
    <View className="flex flex-col gap-2">
      {/* 标签 */}
      <View className="flex flex-row items-center">
        <Text className="font-medium text-black">{label}</Text>
        {required && <Text className="text-red-500 ml-1">*</Text>}
      </View>

      {/* 步进器容器*/}
      <View className="flex flex-row items-center">
        <View className="flex flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
          {/* 减号按钮 */}
          <View
            className={`w-10 h-10 flex items-center justify-center border-r border-gray-300 transition-colors ${
              count <= min ? 'text-orange-300 bg-orange-50' : 'text-orange-700 bg-orange-50'
            }`}
            onClick={handleDecrease}
            style={{ userSelect: 'none' }}
          >
            <Text className="text-xl font-bold">−</Text>
          </View>

          {/* 数值显示 */}
          <View className="w-14 h-10 flex items-center justify-center bg-white">
            {/* 🔧 修复拼写：text-block -> text-black */}
            <Text className="text-base font-semibold text-black">{count}人</Text>
          </View>

          {/* 加号按钮 */}
          <View
            className={`w-10 h-10 flex items-center justify-center border-l border-gray-300 transition-colors ${
              count >= max ? 'text-orange-300 bg-orange-50' : 'text-orange-700 bg-orange-50'
            }`}
            onClick={handleIncrease}
            style={{ userSelect: 'none' }}
          >
            <Text className="text-xl font-bold">+</Text>
          </View>
        </View>

        {/* 右侧范围提示 */}
        <Text className="ml-3 text-sm text-gray-500">
          {min}-{max}人
        </Text>
      </View>
    </View>
  )
}
