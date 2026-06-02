import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import GameHeroCard from '@/components/Game/GameHeroCard'
import GameTimeline from '@/components/Game/GameTimeline'
import SectionCard from '@/components/Game/SectionCard'
import MusicPlayer from '@/components/MusicPlayer'
import MusicSettings from '@/pages/wizard/components/MusicSettings'
import { parseGameContent } from '@/utils/gameParser'

export interface ResultPreviewConfig {
  step: number
  title: string
  previewTemplate?: string
  actions?: Array<{ label: string; action: string; api?: string }>
}

interface GeneratedResult {
  record_id?: number
  age?: number
  game_type?: string
  scene_template?: string
  game_name?: string
  generated_content: string
  music?: string
  created_at?: string
  businessType?: string
}

interface ResultPreviewProps {
  config: ResultPreviewConfig
  value: Record<string, any>
  onChange: (data: Record<string, any>) => void
  onSubPageChange?: (active: boolean) => void
  showMusicSwitch?: boolean
}

export default function ResultPreview({
  value,
  onChange,
  onSubPageChange,
  showMusicSwitch = true,
}: ResultPreviewProps) {
  const [showMusicSettings, setShowMusicSettings] = useState(false)

  const toggleMusicSettings = (show: boolean) => {
    setShowMusicSettings(show)
    onSubPageChange?.(show)
  }

  const generatedResults: GeneratedResult[] = value.generatedResults || []
  const hasResults = generatedResults.length > 0

  if (!hasResults) {
    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '100px',
          backgroundColor: '#f7f8fa',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <Text style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</Text>
        <Text style={{ fontSize: '16px', color: '#86909c', fontWeight: '500' }}>
          请先生成游戏结果
        </Text>
        <Text style={{ fontSize: '14px', color: '#c9cdd4', marginTop: '8px' }}>
          完成前面的配置步骤后即可一键生成
        </Text>
      </View>
    )
  }

  if (showMusicSettings) {
    return (
      <MusicSettings
        data={value}
        updateData={(key: string, val: any) => onChange({ [key]: val })}
        currentStep={{}}
        onBack={() => toggleMusicSettings(false)}
      />
    )
  }

  const realResult = generatedResults[0]
  const game = parseGameContent(realResult.generated_content)

  const musicUrl = value.selectedMusicUrl || realResult.music || ''

  return (
    <View
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '16px',
        paddingBottom: '24px',
        boxSizing: 'border-box',
      }}
    >
      <View
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxSizing: 'border-box',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <GameHeroCard
          name={game.name}
          tag={realResult.game_type || value.gameType}
          age={realResult.age || value.age}
          playerCount={value.playerCount}
          gameType={realResult.game_type || value.gameType}
        />

        {game.space && (
          <SectionCard title="活动空间" icon="📍">
            <Text
              style={{
                fontSize: '14px',
                color: '#4b5563',
                lineHeight: '24px',
                textAlign: 'justify',
              }}
            >
              {game.space}
            </Text>
          </SectionCard>
        )}

        {game.preparations.length > 0 && (
          <SectionCard title="前期准备" icon="🎒">
            <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {game.preparations.map((item, idx) => (
                <Text key={idx} style={{ fontSize: '14px', color: '#4b5563', lineHeight: '22px' }}>
                  📦 {item}
                </Text>
              ))}
            </View>
          </SectionCard>
        )}

        <GameTimeline rounds={game.rounds} />

        {game.scripts.length > 0 && (
          <SectionCard title="游戏白话稿" variant="script">
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {game.scripts.map((script, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: '#fffbeb',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #fef3c7',
                  }}
                >
                  <Text
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#92400e',
                      marginBottom: '8px',
                      display: 'block',
                    }}
                  >
                    {script.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: '14px',
                      color: '#78350f',
                      lineHeight: '22px',
                      textAlign: 'justify',
                    }}
                  >
                    {script.content}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {game.tips.length > 0 && (
          <SectionCard title="安全提醒" variant="safety">
            <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {game.tips.map((tip, idx) => (
                <Text key={idx} style={{ fontSize: '14px', color: '#c2410c', lineHeight: '20px' }}>
                  • {tip}
                </Text>
              ))}
            </View>
          </SectionCard>
        )}

        {musicUrl && (
          <View style={{ marginBottom: '24px' }}>
            <MusicPlayer
              musicUrl={musicUrl}
              onChangeMusicClick={showMusicSwitch ? () => toggleMusicSettings(true) : undefined}
            />
          </View>
        )}
      </View>
    </View>
  )
}
