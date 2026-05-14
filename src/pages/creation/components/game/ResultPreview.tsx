import { View, Text, Button } from '@tarojs/components'
import classNames from 'classnames'

export interface ResultPreviewCardProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

export default function ResultPreviewCard({ data, updateData }: ResultPreviewCardProps) {
  const { selectedProps = [], selectedTemplate, params = {} } = data
  const isLoading = data.isLoading || false

  const handleGenerate = () => {
    updateData('isLoading', true)
    // 模拟生成
    setTimeout(() => {
      updateData('isLoading', false)
    }, 2000)
  }

  const handleExport = () => {
    console.log('导出游戏配置', data)
  }

  return (
    <View className="w-full bg-white rounded-lg p-4">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">游戏规则预览</Text>
        <Text className="text-sm text-gray-600">检查游戏配置，确认无误后生成</Text>
      </View>

      {/* Preview Cards */}
      <View className="flex flex-col gap-4 mb-6">
        {/* Template Info */}
        {selectedTemplate && (
          <View className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <Text className="text-sm font-semibold text-gray-900 mb-2">选中模板</Text>
            <Text className="text-base font-bold text-orange-600 mb-1">{selectedTemplate}</Text>
          </View>
        )}

        {/* Props Info */}
        {selectedProps.length > 0 && (
          <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              已选道具 ({selectedProps.length})
            </Text>
            <Text className="text-sm text-gray-700">{selectedProps.join(', ')}</Text>
          </View>
        )}

        {/* Game Parameters */}
        {Object.keys(params).length > 0 && (
          <View className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <Text className="text-sm font-semibold text-gray-900 mb-3">游戏参数</Text>
            <View className="flex flex-col gap-2">
              {params.gameName && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">游戏名称：</Text>
                  <Text className="text-sm font-medium text-gray-900">{params.gameName}</Text>
                </View>
              )}
              {params.gameType && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">游戏类型：</Text>
                  <Text className="text-sm font-medium text-gray-900">{params.gameType}</Text>
                </View>
              )}
              {params.playerCount && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">参与人数：</Text>
                  <Text className="text-sm font-medium text-gray-900">{params.playerCount}</Text>
                </View>
              )}
              {params.duration && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">游戏时长：</Text>
                  <Text className="text-sm font-medium text-gray-900">{params.duration}</Text>
                </View>
              )}
              {params.difficulty && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">难度等级：</Text>
                  <Text className="text-sm font-medium text-gray-900">{params.difficulty}</Text>
                </View>
              )}
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
          <Text>{isLoading ? '生成中...' : '生成游戏'}</Text>
        </Button>

        <Button
          className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-orange-500 text-orange-500 transition-all"
          onClick={handleExport}
          disabled={isLoading}
        >
          <Text>导出</Text>
        </Button>
      </View>

      {/* Tips */}
      <View className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-xs text-yellow-800">💡 提示：生成后可以继续编辑游戏规则和参数</Text>
      </View>
    </View>
  )
}
