import { View, Text, Input, Picker } from '@tarojs/components'

export interface ParamSettingsProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

/**
 * ParamSettings Component
 *
 * 参数设置页：游戏名称、年龄、人数等
 */
export default function ParamSettings({ data, updateData }: ParamSettingsProps) {
  const ages = ['2-3岁', '3-4岁', '4-5岁', '5-6岁', '6-7岁']
  const playerCounts = ['5-10人', '10-15人', '15-20人', '20-30人', '30人以上']

  const handlePickerChange = (field: string, options: string[]) => (e: any) => {
    const selectedValue = options[e.detail.value]
    updateData(field, selectedValue)
  }

  return (
    <View className="w-full bg-white rounded-lg p-4 flex flex-col gap-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900">参数设置</Text>
        <Text className="text-sm text-gray-600 mt-1">配置游戏参数</Text>
      </View>

      {/* Game Name */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">游戏名称 *</Text>
        <Input
          type="text"
          placeholder="输入游戏名称，例如：森林大冒险"
          value={data.gameName || ''}
          onInput={(e) => {
            console.log('Game name input:', e.detail.value)
            updateData('gameName', e.detail.value)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </View>

      {/* Age */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">适合年龄 *</Text>
        <Picker
          mode="selector"
          range={ages}
          value={ages.indexOf(data.age || '')}
          onChange={handlePickerChange('age', ages)}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Text>{data.age || '选择年龄段'}</Text>
          </View>
        </Picker>
      </View>

      {/* Player Count */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">参与人数 *</Text>
        <Picker
          mode="selector"
          range={playerCounts}
          value={playerCounts.indexOf(data.playerCount || '')}
          onChange={handlePickerChange('playerCount', playerCounts)}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Text>{data.playerCount || '选择人数范围'}</Text>
          </View>
        </Picker>
      </View>

      {/* Summary */}
      {data.gameName && data.age && data.playerCount && (
        <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Text className="text-sm font-semibold text-gray-900 mb-2">参数总结</Text>
          <View className="flex flex-col gap-1">
            <Text className="text-xs text-gray-700">游戏名称：{data.gameName}</Text>
            <Text className="text-xs text-gray-700">适合年龄：{data.age}</Text>
            <Text className="text-xs text-gray-700">参与人数：{data.playerCount}</Text>
          </View>
        </View>
      )}
    </View>
  )
}
