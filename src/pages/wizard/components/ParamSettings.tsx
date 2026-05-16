import { View, Text, Input } from '@tarojs/components'
import Card from '@/components/Card'
import { AgeSelector, PlayerCountSelector, GameTypeSelector } from './Form'

export interface ParamSettingsProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

/**
 * ParamSettings Component
 *
 * 参数设置页：游戏名称、年龄、人数、游戏类型等
 * 使用模块化的 Form 组件来构建表单
 */
export default function ParamSettings({ data, updateData }: ParamSettingsProps) {
  return (
    <Card className="p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">参数设置</Text>
        <Text className="text-sm text-gray-600">配置游戏参数</Text>
      </View>

      <View className="flex flex-col gap-4">
        {/* Game Name */}
        <View className="flex flex-col gap-2">
          <Text className="text-sm font-medium text-gray-700">
            游戏名称
            <Text className="text-red-500"> *</Text>
          </Text>
          <Input
            type="text"
            placeholder="输入游戏名称，例如：森林大冒险"
            value={data.gameName || ''}
            onInput={(e) => updateData('gameName', e.detail.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </View>

        {/* Age Selector */}
        <AgeSelector
          value={data.age}
          onChange={(value) => updateData('age', value)}
          label="适合年龄"
          required
        />

        {/* Player Count Selector */}
        <PlayerCountSelector
          value={data.playerCount}
          onChange={(value) => updateData('playerCount', value)}
          label="参与人数"
          required
        />

        {/* Game Type Selector */}
        <GameTypeSelector
          value={data.gameType}
          onChange={(value) => updateData('gameType', value)}
          label="游戏类型"
          required
        />

        {/* Summary */}
        {data.gameName && data.age && data.playerCount && data.gameType && (
          <View className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Text className="text-sm font-semibold text-gray-900 mb-2">📋 参数总结</Text>
            <View className="flex flex-col gap-1">
              <Text className="text-xs text-gray-700">🎮 游戏名称：{data.gameName}</Text>
              <Text className="text-xs text-gray-700">👶 适合年龄：{data.age}</Text>
              <Text className="text-xs text-gray-700">👥 参与人数：{data.playerCount}</Text>
              <Text className="text-xs text-gray-700">🎯 游戏类型：{data.gameType}</Text>
            </View>
          </View>
        )}
      </View>
    </Card>
  )
}
