import { View, Text, Picker, Switch } from '@tarojs/components'
import classNames from 'classnames'
import type { CreationState } from '../types'

export interface MusicSettingsProps {
  musicSettings: CreationState['musicSettings']
  onMusicSettingsChange: (settings: CreationState['musicSettings']) => void
}

/**
 * MusicSettings Component
 *
 * 音乐音效页：生成 BGM、音效配置
 */
export default function MusicSettings({
  musicSettings = {},
  onMusicSettingsChange,
}: MusicSettingsProps) {
  const bgmOptions = ['无', '轻松欢快', '冒险刺激', '神秘诡异', '温暖治愈']
  const soundEffectOptions = ['无', '点击音效', '成功音效', '失败音效', '全部']

  const handleBgmChange = (e: any) => {
    const bgm = bgmOptions[e.detail.value]
    onMusicSettingsChange({
      ...musicSettings,
      bgm,
    })
  }

  const handleSoundEffectChange = (e: any) => {
    const soundEffect = soundEffectOptions[e.detail.value]
    onMusicSettingsChange({
      ...musicSettings,
      soundEffects: soundEffect === '无' ? [] : [soundEffect],
    })
  }

  return (
    <View className="w-full bg-white rounded-lg p-4 space-y-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900">音乐音效设置</Text>
        <Text className="text-sm text-gray-600 mt-1">为游戏添加背景音乐和音效</Text>
      </View>

      {/* BGM Selection */}
      <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <Text className="text-sm font-semibold text-gray-900 mb-3">背景音乐 (BGM)</Text>
        <Picker
          mode="selector"
          range={bgmOptions}
          value={bgmOptions.indexOf(musicSettings?.bgm || '无')}
          onChange={handleBgmChange}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white">
            <Text>{musicSettings?.bgm || '选择背景音乐'}</Text>
          </View>
        </Picker>

        {/* BGM Preview */}
        {musicSettings?.bgm && musicSettings.bgm !== '无' && (
          <View className="mt-3 p-2 bg-white rounded border border-blue-300">
            <Text className="text-xs text-gray-600">🎵 预览：{musicSettings.bgm}</Text>
          </View>
        )}
      </View>

      {/* Sound Effects Selection */}
      <View className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <Text className="text-sm font-semibold text-gray-900 mb-3">音效配置</Text>
        <Picker
          mode="selector"
          range={soundEffectOptions}
          value={soundEffectOptions.indexOf(musicSettings?.soundEffects?.[0] || '无')}
          onChange={handleSoundEffectChange}
        >
          <View className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white">
            <Text>
              {musicSettings?.soundEffects?.length ? musicSettings.soundEffects[0] : '选择音效'}
            </Text>
          </View>
        </Picker>

        {/* Sound Effects List */}
        {musicSettings?.soundEffects && musicSettings.soundEffects.length > 0 && (
          <View className="mt-3 space-y-2">
            {musicSettings.soundEffects.map((effect, index) => (
              <View
                key={index}
                className="p-2 bg-white rounded border border-green-300 flex items-center justify-between"
              >
                <Text className="text-xs text-gray-700">🔊 {effect}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Volume Control */}
      <View className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
        <Text className="text-sm font-semibold text-gray-900 mb-3">音量设置</Text>
        <View className="space-y-3">
          <View className="flex items-center justify-between">
            <Text className="text-sm text-gray-700">背景音乐音量</Text>
            <View className="flex items-center gap-2">
              <Text className="text-xs text-gray-600">低</Text>
              <View className="w-24 h-1 bg-gray-300 rounded-full" />
              <Text className="text-xs text-gray-600">高</Text>
            </View>
          </View>
          <View className="flex items-center justify-between">
            <Text className="text-sm text-gray-700">音效音量</Text>
            <View className="flex items-center gap-2">
              <Text className="text-xs text-gray-600">低</Text>
              <View className="w-24 h-1 bg-gray-300 rounded-full" />
              <Text className="text-xs text-gray-600">高</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-xs text-yellow-800">
          💡 提示：音乐和音效会增强游戏的沉浸感，建议根据游戏主题选择
        </Text>
      </View>
    </View>
  )
}
