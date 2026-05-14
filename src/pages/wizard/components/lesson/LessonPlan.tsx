import { View, Text, Button } from '@tarojs/components'
import classNames from 'classnames'
import { MOVEMENTS, AGE_GROUPS } from '../../../wizard/constants/movements'

export interface LessonPlanCardProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

export default function LessonPlanCard({ data, updateData }: LessonPlanCardProps) {
  const { selectedMovements = [], selectedAgeGroup = '3-6', playerCount = 20 } = data
  const isLoading = data.isLoading || false

  // 获取选中的动作信息
  const selectedMovementDetails = MOVEMENTS.filter((m) => selectedMovements.includes(m.id))

  const ageGroupLabel = AGE_GROUPS.find((g) => g.id === selectedAgeGroup)?.label

  const handleGenerate = () => {
    updateData('isLoading', true)
    // 模拟生成
    setTimeout(() => {
      updateData('isLoading', false)
      updateData('lessonGenerated', true)
    }, 2000)
  }

  const handleExport = () => {
    console.log('导出教案', data)
  }

  return (
    <View className="w-full bg-white rounded-lg p-4">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">教案预览</Text>
        <Text className="text-sm text-gray-600">检查教案配置，确认无误后生成</Text>
      </View>

      {/* 教案配置总结 */}
      <View className="flex flex-col gap-4 mb-6">
        {/* 基本信息 */}
        <View className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <Text className="text-sm font-semibold text-gray-900 mb-3">基本信息</Text>
          <View className="flex flex-col gap-2">
            <View className="flex justify-between">
              <Text className="text-sm text-gray-600">参与人数：</Text>
              <Text className="text-sm font-medium text-gray-900">👥 {playerCount}人</Text>
            </View>
            <View className="flex justify-between">
              <Text className="text-sm text-gray-600">平均年龄：</Text>
              <Text className="text-sm font-medium text-gray-900">👶 {ageGroupLabel}</Text>
            </View>
            <View className="flex justify-between">
              <Text className="text-sm text-gray-600">教学动作数：</Text>
              <Text className="text-sm font-medium text-gray-900">
                🏃 {selectedMovements.length}个
              </Text>
            </View>
          </View>
        </View>

        {/* 选中的动作 */}
        {selectedMovementDetails.length > 0 && (
          <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Text className="text-sm font-semibold text-gray-900 mb-3">教学动作列表</Text>
            <View className="flex flex-col gap-2">
              {selectedMovementDetails.map((movement) => (
                <View
                  key={movement.id}
                  className="flex items-center gap-2 pb-2 border-b border-blue-100"
                >
                  <Text className="text-xl">{movement.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{movement.name}</Text>
                    <Text className="text-xs text-gray-600">{movement.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 生成的教案预览 */}
        {data.lessonGenerated && (
          <View className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <Text className="text-sm font-semibold text-gray-900 mb-3">📋 生成的教案内容</Text>
            <View className="flex flex-col gap-3">
              <View>
                <Text className="text-xs font-semibold text-gray-700 mb-1">训练主题</Text>
                <Text className="text-xs text-gray-600">基础跑酷动作组合训练</Text>
              </View>
              <View>
                <Text className="text-xs font-semibold text-gray-700 mb-1">训练目标</Text>
                <Text className="text-xs text-gray-600">
                  • 提升幼儿身体协调性与灵活性
                  {'\n'}• 培养幼儿勇敢、坚持的品质
                  {'\n'}• 增强幼儿团队合作意识
                </Text>
              </View>
              <View>
                <Text className="text-xs font-semibold text-gray-700 mb-1">训练流程</Text>
                <Text className="text-xs text-gray-600">
                  1. 热身阶段（5分钟）
                  {'\n'}2. 基础动作教学（20分钟）
                  {'\n'}3. 动作组合练习（15分钟）
                  {'\n'}4. 游戏互动（5分钟）
                </Text>
              </View>
              <View>
                <Text className="text-xs font-semibold text-gray-700 mb-1">活动准备</Text>
                <Text className="text-xs text-gray-600">
                  • 场地布置：设置障碍物、软垫、平衡木等
                  {'\n'}• 器材准备：软垫、平衡木、跳箱、标志筒等
                  {'\n'}• 经验准备：幼儿已初步掌握基础动作
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex gap-3">
        <Button
          className={classNames('flex-1 py-3 px-4 rounded-lg font-semibold transition-all', {
            'bg-orange-500 text-white': !isLoading,
            'bg-gray-400 text-white cursor-not-allowed': isLoading,
          })}
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <Text>{isLoading ? '生成中...' : '生成教案'}</Text>
        </Button>

        <Button
          className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-orange-500 text-orange-500 transition-all"
          onClick={handleExport}
          disabled={isLoading}
        >
          <Text>导出PDF</Text>
        </Button>
      </View>

      {/* Tips */}
      <View className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-xs text-yellow-800">
          💡 提示：生成的教案可以根据实际需要进行调整和优化
        </Text>
      </View>
    </View>
  )
}
