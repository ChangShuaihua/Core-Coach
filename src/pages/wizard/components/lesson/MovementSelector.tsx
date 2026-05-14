import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import classNames from 'classnames'
import { MOVEMENTS, AGE_GROUPS, DIFFICULTY_LABELS } from '../../../wizard/constants/movements'
import type { Movement } from '../../../wizard/constants/movements'

export interface MovementSelectorCardProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

export default function MovementSelectorCard({ data, updateData }: MovementSelectorCardProps) {
  const selectedMovements = data.selectedMovements || []
  const selectedAgeGroup = data.selectedAgeGroup || '3-6'
  const playerCount = data.playerCount || 20
  const [searchText, setSearchText] = useState('')

  // 根据年龄段筛选动作
  const filteredMovements = MOVEMENTS.filter((movement) => {
    const matchesAge = movement.ageGroups.includes(selectedAgeGroup as any)
    const matchesSearch = movement.name.toLowerCase().includes(searchText.toLowerCase())
    return matchesAge && matchesSearch
  })

  // 按难度分组
  const groupedMovements = {
    easy: filteredMovements.filter((m) => m.difficulty === 'easy'),
    medium: filteredMovements.filter((m) => m.difficulty === 'medium'),
    hard: filteredMovements.filter((m) => m.difficulty === 'hard'),
  }

  const handleMovementToggle = (movementId: string) => {
    const newSelected = selectedMovements.includes(movementId)
      ? selectedMovements.filter((id: string) => id !== movementId)
      : [...selectedMovements, movementId]
    updateData('selectedMovements', newSelected)
  }

  const handleAgeGroupChange = (ageGroup: string) => {
    updateData('selectedAgeGroup', ageGroup)
  }

  const handlePlayerCountChange = (delta: number) => {
    const newCount = Math.max(1, playerCount + delta)
    updateData('playerCount', newCount)
  }

  return (
    <View className="w-full bg-white rounded-lg p-4">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">教案参数设置</Text>
        <Text className="text-sm text-gray-600">选择教学动作、人数和年龄段</Text>
      </View>

      {/* 人数设置 */}
      <View className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <Text className="text-2xl">👥</Text>
            <Text className="text-sm font-semibold text-gray-900">参与人数</Text>
            <Text className="text-red-500">*</Text>
          </View>
        </View>
        <View className="flex items-center justify-between">
          <View
            className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center cursor-pointer"
            onClick={() => handlePlayerCountChange(-1)}
          >
            <Text className="text-lg font-bold text-gray-600">−</Text>
          </View>
          <Text className="text-2xl font-bold text-orange-500">{playerCount}人</Text>
          <View
            className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center cursor-pointer"
            onClick={() => handlePlayerCountChange(1)}
          >
            <Text className="text-lg font-bold text-gray-600">+</Text>
          </View>
        </View>
      </View>

      {/* 年龄段选择 */}
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-3">
          <Text className="text-2xl">👶</Text>
          <Text className="text-sm font-semibold text-gray-900">平均年龄</Text>
          <Text className="text-red-500">*</Text>
        </View>
        <View className="flex gap-2">
          {AGE_GROUPS.map((group) => (
            <View
              key={group.id}
              className={classNames(
                'flex-1 py-2 px-3 rounded-lg text-center cursor-pointer transition-all border-2',
                {
                  'bg-orange-500 text-white border-orange-500': selectedAgeGroup === group.id,
                  'bg-white text-gray-700 border-gray-300': selectedAgeGroup !== group.id,
                }
              )}
              onClick={() => handleAgeGroupChange(group.id)}
            >
              <Text className="text-xs font-semibold">{group.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 动作库 */}
      <View className="mb-6">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <Text className="text-2xl">🏃</Text>
            <Text className="text-sm font-semibold text-gray-900">教学动作</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <Text className="text-xs text-gray-600">
            已选 <Text className="text-orange-500 font-semibold">{selectedMovements.length}</Text>
          </Text>
        </View>

        {/* 搜索框 */}
        <View className="mb-4">
          <Input
            type="text"
            placeholder="搜索动作名称"
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </View>

        {/* 动作分组显示 */}
        {Object.entries(groupedMovements).map(([difficulty, movements]) => {
          if (movements.length === 0) return null

          return (
            <View key={difficulty} className="mb-4">
              <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                {DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS]}
              </Text>
              <View className="grid grid-cols-2 gap-3">
                {movements.map((movement: Movement) => {
                  const isSelected = selectedMovements.includes(movement.id)

                  return (
                    <View
                      key={movement.id}
                      className={classNames(
                        'p-3 rounded-lg cursor-pointer transition-all border-2',
                        {
                          'bg-orange-100 border-orange-500 ring-2 ring-orange-300': isSelected,
                          'bg-white border-gray-200': !isSelected,
                        }
                      )}
                      onClick={() => handleMovementToggle(movement.id)}
                    >
                      <View className="flex items-start justify-between mb-2">
                        <Text className="text-2xl">{movement.emoji}</Text>
                        {isSelected && (
                          <View className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <Text className="text-white text-xs font-bold">✓</Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className={classNames('text-sm font-semibold mb-1', {
                          'text-orange-600': isSelected,
                          'text-gray-900': !isSelected,
                        })}
                      >
                        {movement.name}
                      </Text>
                      <Text className="text-xs text-gray-600">{movement.description}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}

        {filteredMovements.length === 0 && (
          <View className="py-8 text-center">
            <Text className="text-gray-500 text-sm">该年龄段暂无匹配的动作</Text>
          </View>
        )}
      </View>

      {/* 参数总结 */}
      {selectedMovements.length > 0 && (
        <View className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Text className="text-sm font-semibold text-gray-900 mb-3">参数总结</Text>
          <View className="flex flex-col gap-2">
            <View className="flex justify-between text-xs">
              <Text className="text-gray-600">参与人数：</Text>
              <Text className="font-medium text-gray-900">{playerCount}人</Text>
            </View>
            <View className="flex justify-between text-xs">
              <Text className="text-gray-600">平均年龄：</Text>
              <Text className="font-medium text-gray-900">
                {AGE_GROUPS.find((g) => g.id === selectedAgeGroup)?.label}
              </Text>
            </View>
            <View className="flex justify-between text-xs">
              <Text className="text-gray-600">选中动作：</Text>
              <Text className="font-medium text-gray-900">{selectedMovements.length}个</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
