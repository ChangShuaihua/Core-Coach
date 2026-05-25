import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import MusicPlayer from '@/components/MusicPlayer'
import MusicSettings from '@/pages/wizard/components/MusicSettings'

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

  // 如果正在显示音乐设置，渲染 MusicSettings 组件
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

  const parseRealContent = (content: string) => {
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    let name = '新生成游戏'
    let tag = '团队游戏'
    let rule = '暂无玩法规则描述'
    const steps: string[] = []
    const tips: string[] = []

    lines.forEach((line) => {
      if (line.includes('【游戏名称】')) {
        name = line.replace(/【游戏名称】[：:]?\s*/, '').trim()
      } else if (line.includes('【游戏形式】')) {
        tag = line.replace(/【游戏形式】[：:]?\s*/, '').trim()
      } else if (line.includes('【玩法规则】')) {
        rule = line.replace(/【玩法规则】[：:]?\s*/, '').trim()
      } else if (line.includes('【温馨提示】')) {
        const cleanTip = line.replace(/【温馨提示】[：:]?\s*/, '').trim()
        if (cleanTip) tips.push(cleanTip)
      } else if (line.includes('（安全提醒）')) {
        const match = line.match(/（安全提醒）[）)]\s*[：:]?\s*(.+)/)
        if (match) tips.push(match[1].trim())
      } else if (line.includes('（规则简述）')) {
        const match = line.match(/（规则简述）[）)]\s*[：:]?\s*(.+)/)
        if (match) steps.push(match[1].trim())
      }
    })

    if (steps.length === 0) {
      lines.forEach((line) => {
        const stepMatch = line.match(/^[❶❷❸❹❺❻❼❽❾❿⓫⓬\d\.\-\s、]+(.*)/)
        if (stepMatch && (line.includes('流程') || steps.length < 5)) {
          const cleanStep = stepMatch[1].trim()
          if (cleanStep) steps.push(cleanStep)
        }
      })
    }

    return {
      name,
      tag,
      rule,
      steps:
        steps.length > 0
          ? steps
          : ['确认场地与道具', '分发任务卡并讲解规则', '分组开展游戏对抗', '游戏结束，复盘颁奖'],
      tips:
        tips.length > 0
          ? tips
          : ['请确保活动区域安全。', '儿童请在成人陪同下参与。', '注意防晒防蚊，及时补充水分。'],
    }
  }

  const game = parseRealContent(realResult.generated_content)

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
      {/* 游戏详情主卡片 */}
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
        {/* 头部标题与 Tag */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}
        >
          <Text
            style={{
              flex: 1,
              paddingRight: '16px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
            }}
          >
            {game.name}
          </Text>
          <View
            style={{
              backgroundColor: '#fff7ed',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid #ffedd5',
              flexShrink: 0,
            }}
          >
            <Text style={{ fontSize: '12px', color: '#ea580c', fontWeight: '500' }}>
              {game.tag}
            </Text>
          </View>
        </View>

        {/* 基础配置 */}
        <View style={{ marginBottom: '24px' }}>
          <Text
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '12px',
              display: 'block',
            }}
          >
            基础配置
          </Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: '16px',
            }}
          >
            <View
              style={{ width: '50%', display: 'flex', flexDirection: 'row', marginBottom: '12px' }}
            >
              <Text style={{ fontSize: '14px', color: '#6b7280' }}>适合年龄：</Text>
              <Text style={{ fontSize: '14px', color: '#f97316', fontWeight: '500' }}>
                {realResult.age ? `${realResult.age}岁` : value.age || '6-10岁'}
              </Text>
            </View>
            <View
              style={{ width: '50%', display: 'flex', flexDirection: 'row', marginBottom: '12px' }}
            >
              <Text style={{ fontSize: '14px', color: '#6b7280' }}>参与人数：</Text>
              <Text style={{ fontSize: '14px', color: '#f97316', fontWeight: '500' }}>
                {value.playerCount || '10-20人'}
              </Text>
            </View>
            <View
              style={{ width: '50%', display: 'flex', flexDirection: 'row', marginBottom: '4px' }}
            >
              <Text style={{ fontSize: '14px', color: '#6b7280' }}>游戏类型：</Text>
              <Text style={{ fontSize: '14px', color: '#f97316', fontWeight: '500' }}>
                {realResult.game_type || value.gameType || '循环式'}
              </Text>
            </View>
          </View>
        </View>

        {/* 玩法规则 */}
        <View style={{ marginBottom: '24px' }}>
          <Text
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px',
              display: 'block',
            }}
          >
            玩法规则
          </Text>
          <Text
            style={{ fontSize: '14px', color: '#4b5563', lineHeight: '24px', textAlign: 'justify' }}
          >
            {game.rule}
          </Text>
        </View>

        {/* 执行流程 */}
        <View style={{ marginBottom: '24px' }}>
          <Text
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '12px',
              display: 'block',
            }}
          >
            执行流程
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {game.steps.map((step, idx) => (
              <View
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <View
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#f97316',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold' }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={{ fontSize: '14px', color: '#374151', lineHeight: '22px', flex: 1 }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 温馨提示 */}
        <View
          style={{
            backgroundColor: 'rgba(255, 247, 237, 0.7)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #ffedd5',
            marginBottom: '24px',
          }}
        >
          <Text
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#ea580c',
              marginBottom: '8px',
              display: 'block',
            }}
          >
            温馨提示
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {game.tips.map((tip, idx) => (
              <Text key={idx} style={{ fontSize: '12px', color: '#c2410c', lineHeight: '20px' }}>
                • {tip}
              </Text>
            ))}
          </View>
        </View>

        {/* 背景音乐信息 */}
        {realResult.music && (
          <View style={{ marginBottom: '24px' }}>
            <View
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <View style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                  背景音乐
                </Text>
                <Text
                  style={{
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {realResult.game_name || '游戏配乐'}
                </Text>
              </View>
              {showMusicSwitch && (
                <Text
                  style={{
                    fontSize: '13px',
                    color: '#f97316',
                    fontWeight: '500',
                    marginLeft: '16px',
                    flexShrink: 0,
                  }}
                  onClick={() => toggleMusicSettings(true)}
                >
                  更换音乐
                </Text>
              )}
            </View>
            <MusicPlayer musicUrl={realResult.music} />
          </View>
        )}
      </View>
    </View>
  )
}
