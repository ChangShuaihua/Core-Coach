import { View, Text, Input, Picker } from '@tarojs/components'
import classNames from 'classnames'
import type { CreationState } from '../types'

export interface ParamSettingsProps {
  params: CreationState['params']
  onParamsChange: (params: CreationState['params']) => void
}

/**
 * ParamSettings Component
 *
 * 参数设置页：游戏类型、人数、时长、难度、名称
 */
export default function ParamSettings({ params = {}, onParamsChange }: ParamSettingsProps) {
  const gameTypes = ['冒险', '益智', '竞速', '合作', '其他']
  const difficulties = ['简单', '中等', '困难']
  const playerCounts = ['1人', '2人', '3人', '4人', '5人', '6人+']
  const durations = ['5分钟', '10分钟', '15分钟', '20分钟', '30分钟', '45分钟']

  const handleInputChange = (field: string, value: any) => {
    onParamsChange({
      ...params,
      [field]: value,
    })
  }

  const handlePickerChange = (field: string, options: string[]) => (e: any) => {
    const value = options[e.detail.value]
    handleInputChange(field, value)
  }

  return (
    <View className="w-full bg-white rounded-lg p-4 space-y-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900">参数设置</Text>
      </View>

      {/* Game Name */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">游戏名称</Text>
        <Input
          type="text"
          placeholder="输入游戏名称"
          value={params?.gameName || ''}
          onInput={(e) => handleInputChange('gameName', e.detail.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </View>

      {/* Game Type */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">游戏类型</Text>
        <Picker
          mode="selector"
          range={gameTypes}
          value={gameTypes.indexOf(params?.gameType || '')}
          onChange={handlePickerChange('gameType', gameTypes)}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Text>{params?.gameType || '选择游戏类型'}</Text>
          </View>
        </Picker>
      </View>

      {/* Player Count */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">参与人数</Text>
        <Picker
          mode="selector"
          range={playerCounts}
          value={playerCounts.indexOf(params?.playerCount ? `${params.playerCount}人` : '')}
          onChange={handlePickerChange('playerCount', playerCounts)}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Text>{params?.playerCount ? `${params.playerCount}人` : '选择人数'}</Text>
          </View>
        </Picker>
      </View>

      {/* Duration */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">游戏时长</Text>
        <Picker
          mode="selector"
          range={durations}
          value={durations.indexOf(params?.duration ? `${params.duration}分钟` : '')}
          onChange={handlePickerChange('duration', durations)}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Text>{params?.duration ? `${params.duration}分钟` : '选择时长'}</Text>
          </View>
        </Picker>
      </View>

      {/* Difficulty */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">难度等级</Text>
        <View className="flex gap-2">
          {difficulties.map((difficulty) => (
            <View
              key={difficulty}
              className={classNames(
                'flex-1 py-2 px-3 rounded-lg text-center text-sm font-medium cursor-pointer transition-all',
                {
                  'bg-orange-500 text-white': params?.difficulty === difficulty.toLowerCase(),
                  'bg-gray-200 text-gray-700 hover:bg-gray-300':
                    params?.difficulty !== difficulty.toLowerCase(),
                }
              )}
              onClick={() => handleInputChange('difficulty', difficulty.toLowerCase())}
            >
              <Text>{difficulty}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
