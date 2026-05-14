import { View, Text, Picker, Switch } from '@tarojs/components'

export interface MusicSettingsProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

/**
 * MusicSettings Component
 *
 * 音乐音效页：生成 BGM、音效配置
 */
export default function MusicSettings({ data, updateData }: MusicSettingsProps) {
  const bgmOptions = ['无', '轻松欢快', '冒险刺激', '神秘诡异', '温暖治愈']
  const soundEffectOptions = ['无', '点击音效', '成功音效', '失败音效', '全部']

  const musicSettings = data.musicSettings || {}

  const handleBgmChange = (e: any) => {
    const selectedBgm = bgmOptions[e.detail.value]
    updateData('musicSettings', {
      ...musicSettings,
      bgm: selectedBgm,
    })
  }

  const handleSoundEffectChange = (e: any) => {
    const selectedEffect = soundEffectOptions[e.detail.value]
    updateData('musicSettings', {
      ...musicSettings,
      soundEffect: selectedEffect,
    })
  }

  const handleVolumeChange = (type: 'bgm' | 'effect', value: number) => {
    updateData('musicSettings', {
      ...musicSettings,
      [`${type}Volume`]: value,
    })
  }

  return (
    <View className="w-full bg-white rounded-lg p-4 flex flex-col gap-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900">音乐音效</Text>
        <Text className="text-sm text-gray-600 mt-1">配置音乐和音效（可选）</Text>
      </View>

      {/* Background Music */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">背景音乐</Text>
        <Picker
          mode="selector"
          range={bgmOptions}
          value={bgmOptions.indexOf(musicSettings.bgm || '无')}
          onChange={handleBgmChange}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Text>{musicSettings.bgm || '选择背景音乐'}</Text>
          </View>
        </Picker>
      </View>

      {/* Sound Effects */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">音效</Text>
        <Picker
          mode="selector"
          range={soundEffectOptions}
          value={soundEffectOptions.indexOf(musicSettings.soundEffect || '无')}
          onChange={handleSoundEffectChange}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Text>{musicSettings.soundEffect || '选择音效'}</Text>
          </View>
        </Picker>
      </View>

      {/* Volume Controls */}
      {musicSettings.bgm && musicSettings.bgm !== '无' && (
        <View className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <Text className="text-sm font-semibold text-gray-900 mb-3">音量设置</Text>
          <View className="flex flex-col gap-3">
            <View className="flex items-center justify-between">
              <Text className="text-sm text-gray-700">背景音乐音量</Text>
              <Text className="text-sm text-gray-600">{musicSettings.bgmVolume || 50}%</Text>
            </View>
            <View className="flex items-center justify-between">
              <Text className="text-sm text-gray-700">音效音量</Text>
              <Text className="text-sm text-gray-600">{musicSettings.effectVolume || 70}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Summary */}
      <View className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <Text className="text-sm font-semibold text-gray-900 mb-2">✅ 音乐配置完成</Text>
        <Text className="text-xs text-gray-600">
          {musicSettings.bgm && musicSettings.bgm !== '无'
            ? `已选择背景音乐：${musicSettings.bgm}`
            : '未选择背景音乐'}
        </Text>
        <Text className="text-xs text-gray-600 mt-1">
          {musicSettings.soundEffect && musicSettings.soundEffect !== '无'
            ? `已选择音效：${musicSettings.soundEffect}`
            : '未选择音效'}
        </Text>
      </View>
    </View>
  )
}
