import { View, Text } from '@tarojs/components'
import classNames from 'classnames'

export interface DifficultySelectorCardProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

const DIFFICULTIES = [
  { id: 'easy', label: '简单', description: '适合初学者', emoji: '⭐' },
  { id: 'medium', label: '中等', description: '适合进阶学生', emoji: '⭐⭐' },
  { id: 'hard', label: '困难', description: '适合高级学生', emoji: '⭐⭐⭐' },
]

export default function DifficultySelectorCard({ data, updateData }: DifficultySelectorCardProps) {
  const selectedDifficulty = data.selectedDifficulty

  const handleDifficultySelect = (difficultyId: string) => {
    updateData('selectedDifficulty', difficultyId)
  }

  return (
    <View className="w-full bg-white rounded-lg p-4">
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">选择难度等级</Text>
        <Text className="text-sm text-gray-600">根据学生水平选择合适的难度</Text>
      </View>

      <View className="space-y-3">
        {DIFFICULTIES.map((difficulty) => {
          const isSelected = selectedDifficulty === difficulty.id

          return (
            <View
              key={difficulty.id}
              className={classNames('p-4 rounded-lg cursor-pointer transition-all border-2', {
                'bg-green-50 border-green-500 ring-2 ring-green-300': isSelected,
                'bg-white border-gray-200 hover:border-gray-300': !isSelected,
              })}
              onClick={() => handleDifficultySelect(difficulty.id)}
            >
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    {difficulty.label}
                  </Text>
                  <Text className="text-sm text-gray-600">{difficulty.description}</Text>
                </View>
                <Text className="text-2xl">{difficulty.emoji}</Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
