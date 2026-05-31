import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { getMusicList } from '@/api/creation'
import type { MusicItem, CurrentMusic } from '@/types/creation'

export interface MusicSettingsProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
  onBack?: () => void
}

export default function MusicSettings({ data, updateData, onBack }: MusicSettingsProps) {
  const generatedResults = data.generatedResults || []
  const recordId = generatedResults[0]?.record_id

  const [currentMusic, setCurrentMusic] = useState<CurrentMusic | null>(null)
  const [musicList, setMusicList] = useState<MusicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    fetchMusicList()
  }, [])

  const fetchMusicList = async () => {
    try {
      setLoading(true)
      const res = await getMusicList(recordId ? { record_id: recordId } : undefined)
      setCurrentMusic(res.current_music || null)
      setMusicList(res.music_list || [])
    } catch (e) {
      console.error('获取音乐列表失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (id: number) => {
    setSelectedId(id)
  }

  const handleConfirm = () => {
    if (selectedId !== null) {
      const selected = musicList.find((m) => m.id === selectedId)
      if (selected) {
        updateData('selectedMusic', selected.music_name)
        updateData('selectedMusicId', selected.id)
        updateData('selectedMusicUrl', selected.music_url)
      }
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
                {currentMusic.music_name}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 音乐列表 */}
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
          可选音乐
        </Text>

        {loading ? (
          <View style={{ padding: '20px', textAlign: 'center' as any }}>
            <Text style={{ fontSize: '14px', color: '#9ca3af' }}>加载中...</Text>
          </View>
        ) : musicList.length === 0 ? (
          <View style={{ padding: '20px', textAlign: 'center' as any }}>
            <Text style={{ fontSize: '14px', color: '#9ca3af' }}>暂无可选音乐</Text>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column' }}>
            {musicList.map((music) => {
              const isSelected = selectedId === music.id
              return (
                <View
                  key={music.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 4px',
                    borderBottom: '1px solid #f9fafb',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSelect(music.id)}
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
                      {music.music_name}
                    </Text>
                    {music.duration && (
                      <Text
                        style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginTop: '2px',
                          display: 'block',
                        }}
                      >
                        {music.duration}
                      </Text>
                    )}
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
        )}
      </View>

      {/* 确认按钮 */}
      <View
        style={{
          width: '100%',
          height: '48px',
          backgroundColor: selectedId !== null ? '#f97316' : '#d1d5db',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: selectedId !== null ? 'pointer' : 'default',
        }}
        onClick={selectedId !== null ? handleConfirm : undefined}
      >
        <Text style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>
          确定选用此音乐
        </Text>
      </View>
    </View>
  )
}
