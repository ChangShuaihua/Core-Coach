import { useEffect, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { getGameConfig } from '@/api/creation'
import type { GameConfig } from '@/api/creation'
import { AgeSelector, PlayerCountSelector, GameTypeSelector } from './Form'

export interface ParamSettingsProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

export default function ParamSettings({ data, updateData }: ParamSettingsProps) {
  const [config, setConfig] = useState<GameConfig | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    getGameConfig().then((res) => {
      setConfig(res)
      if (!data.age && res.age_config) {
        updateData('age', `${res.age_config.default}${res.age_config.unit}`)
      }
    })
  }, [data.age, updateData])

  return (
    <View className="p-6 bg-whit">
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">参数设置</Text>
      </View>

      <View className="flex flex-col gap-4">
        <GameTypeSelector
          value={data.gameType}
          onChange={(value) => updateData('gameType', value)}
          label="游戏类型"
          required
          options={config?.game_types}
        />

        <AgeSelector
          value={data.age}
          onChange={(value) => updateData('age', value)}
          label="适合年龄"
          required
          config={config?.age_config}
        />

        <PlayerCountSelector
          value={data.playerCount}
          onChange={(value) => updateData('playerCount', value)}
          label="参与人数"
          required
        />

        {data.gameName && data.age && data.playerCount && data.gameType && (
          <View className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Text className="text-sm font-semibold text-gray-900 mb-2">📋 参数总结</Text>
            <View className="flex flex-col gap-1">
              <Text className="text-xs text-gray-700">👶 适合年龄：{data.age}</Text>
              <Text className="text-xs text-gray-700">👥 参与人数：{data.playerCount}</Text>
              <Text className="text-xs text-gray-700">🎯 游戏类型：{data.gameType}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
