import { useState } from 'react'
import { View, Text } from '@tarojs/components'

export interface MusicSettingsProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
  onBack?: () => void
}

const musicPresets = [
  { name: '阳光小步伐', desc: '轻快活泼，适合热身活动' },
  { name: '快乐探险家', desc: '冒险风格，适合闯关游戏' },
  { name: '森林奇遇记', desc: '自然清新，适合户外主题' },
  { name: '童趣时光', desc: '可爱童趣，适合低龄儿童' },
  { name: '星星的约定', desc: '温暖治愈，适合放松环节' },
]

export default function MusicSettings({ data, updateData, onBack }: MusicSettingsProps) {
  const generatedResults = data.generatedResults || []
  const currentMusic = generatedResults[0]?.music || ''
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  const handleSelect = (name: string) => {
    setSelectedPreset(name)
  }

  const handleConfirm = () => {
    if (selectedPreset) {
      updateData('selectedMusic', selectedPreset)
    }
    onBack?.()
  }

  return (
    <View
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* 返回按钮 */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: '16px',
          cursor: 'pointer',
        }}
        onClick={() => onBack?.()}
      >
        <Text style={{ fontSize: '16px', color: '#f97316', fontWeight: '500' }}>← 返回</Text>
      </View>

      {/* 标题 */}
      <View
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <Text
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#111827',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          选择背景音乐
        </Text>
        <Text style={{ fontSize: '14px', color: '#9ca3af' }}>为游戏选择合适的背景音乐</Text>
      </View>

      {/* 当前音乐 */}
      {currentMusic && (
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <Text
            style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}
          >
            当前音乐
          </Text>
          <View
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}
          >
            <View
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#fff7ed',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: '18px' }}>🎵</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: '14px', color: '#374151', fontWeight: '500', display: 'block' }}
              >
                AI 生成配乐
              </Text>
              <Text
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  maxWidth: '200px',
                }}
              >
                {currentMusic}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 预设音乐列表 */}
      <View
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <Text
          style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '12px', display: 'block' }}
        >
          预设音乐
        </Text>
        <View style={{ display: 'flex', flexDirection: 'column' }}>
          {musicPresets.map((music) => {
            const isSelected = selectedPreset === music.name
            return (
              <View
                key={music.name}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 4px',
                  borderBottom: '1px solid #f9fafb',
                  cursor: 'pointer',
                }}
                onClick={() => handleSelect(music.name)}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: '14px',
                      color: isSelected ? '#f97316' : '#374151',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      display: 'block',
                    }}
                  >
                    {music.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginTop: '2px',
                      display: 'block',
                    }}
                  >
                    {music.desc}
                  </Text>
                </View>
                <View
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '9999px',
                    border: `1px solid ${isSelected ? '#f97316' : '#d1d5db'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#f97316',
                        borderRadius: '9999px',
                      }}
                    />
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </View>

      {/* 确认按钮 */}
      <View
        style={{
          width: '100%',
          height: '48px',
          backgroundColor: '#f97316',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={handleConfirm}
      >
        <Text style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>
          确定选用此音乐
        </Text>
      </View>
    </View>
  )
}
