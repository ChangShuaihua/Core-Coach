import { View, Text, Button } from '@tarojs/components'
import Card from '@/components/Card'

export interface ResultPreviewConfig {
  step: number
  title: string
  previewTemplate?: string
  actions?: Array<{
    label: string
    action: string
    api?: string
  }>
  required?: boolean
}

interface ResultPreviewProps {
  config: ResultPreviewConfig
  value: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

/**
 * ResultPreview - 结果预览组件
 *
 * 用于处理 type: 'result_preview' 的步骤
 * 显示用户填写的所有数据，并提供操作按钮
 */
export default function ResultPreview({ config, value }: ResultPreviewProps) {
  const handleAction = (action: string, api?: string) => {
    console.log(`执行操作: ${action}`, { api, data: value })

    // 这里可以调用 API
    if (api) {
      // await fetch(api, { method: 'POST', body: JSON.stringify(value) })
    }
  }

  // 渲染预览内容
  const renderPreviewContent = () => {
    return (
      <View className="flex flex-col gap-4">
        {/* 步骤1: 选择的道具/动作 */}
        {value.step_1 && (
          <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              已选项目 ({Array.isArray(value.step_1) ? value.step_1.length : 1})
            </Text>
            <Text className="text-sm text-gray-700">
              {Array.isArray(value.step_1) ? value.step_1.join(', ') : value.step_1}
            </Text>
          </View>
        )}

        {/* 步骤2: 选择的模板 */}
        {value.step_2 && (
          <View className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <Text className="text-sm font-semibold text-gray-900 mb-2">选中模板</Text>
            <Text className="text-base font-bold text-orange-600">{value.step_2}</Text>
          </View>
        )}

        {/* 步骤3: 参数设置 */}
        {(value.gameName || value.age || value.playerCount || value.gameType) && (
          <View className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <Text className="text-sm font-semibold text-gray-900 mb-3">参数设置</Text>
            <View className="flex flex-col gap-2">
              {value.gameName && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">游戏名称：</Text>
                  <Text className="text-sm font-medium text-gray-900">{value.gameName}</Text>
                </View>
              )}
              {value.age && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">适合年龄：</Text>
                  <Text className="text-sm font-medium text-gray-900">{value.age}</Text>
                </View>
              )}
              {value.playerCount && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">参与人数：</Text>
                  <Text className="text-sm font-medium text-gray-900">{value.playerCount}</Text>
                </View>
              )}
              {value.gameType && (
                <View className="flex justify-between">
                  <Text className="text-sm text-gray-600">游戏类型：</Text>
                  <Text className="text-sm font-medium text-gray-900">{value.gameType}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 步骤4: 上传的文件 */}
        {value.step_4 && (
          <View className="bg-green-50 rounded-lg p-4 border border-green-200">
            <Text className="text-sm font-semibold text-gray-900 mb-2">已上传文件</Text>
            <Text className="text-xs text-gray-600 break-all">{value.step_4}</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">{config.title}</Text>
        <Text className="text-sm text-gray-600">检查配置，确认无误后生成</Text>
      </View>

      {/* Preview Content */}
      {renderPreviewContent()}

      {/* Action Buttons */}
      {config.actions && config.actions.length > 0 && (
        <View className="mt-6 flex flex-col gap-3">
          {config.actions.map((action, index) => (
            <Button
              key={index}
              className={`w-full py-3 px-4 rounded-lg font-semibold ${
                index === 0
                  ? 'bg-orange-500 text-white'
                  : 'border-2 border-orange-500 text-orange-500 bg-white'
              }`}
              onClick={() => handleAction(action.action, action.api)}
            >
              <Text className={index === 0 ? 'text-white' : 'text-orange-500'}>{action.label}</Text>
            </Button>
          ))}
        </View>
      )}

      {/* Tips */}
      <View className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-xs text-yellow-800">💡 提示：生成后可以继续编辑游戏规则和参数</Text>
      </View>
    </Card>
  )
}
