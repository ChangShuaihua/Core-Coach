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
    let space = ''
    const preparations: string[] = []
    const rounds: { title: string; props: string; rule: string; safety: string }[] = []
    const scripts: { title: string; content: string }[] = []
    const tips: string[] = []

    // 当前解析状态
    let currentSection = '' // 'preparation' | 'outline' | 'script'
    let currentRound: { title: string; props: string; rule: string; safety: string } | null = null
    let currentScript: { title: string; content: string } | null = null

    const saveRound = () => {
      if (currentRound) {
        rounds.push(currentRound)
        currentRound = null
      }
    }
    const saveScript = () => {
      if (currentScript) {
        scripts.push(currentScript)
        currentScript = null
      }
    }

    for (const line of lines) {
      // 跳过格式标记行
      if (line.startsWith('<输出格式>') || line.startsWith('<格式结束>')) continue

      // 一级标题：1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣
      if (line.includes('【游戏名称】')) {
        name = line.replace(/.*【游戏名称】[：:]?\s*/, '').trim()
        currentSection = ''
      } else if (line.includes('【游戏形式】')) {
        tag = line.replace(/.*【游戏形式】[：:]?\s*/, '').trim()
      } else if (line.includes('【活动空间】')) {
        space = line.replace(/.*【活动空间】[：:]?\s*/, '').trim()
        currentSection = ''
      } else if (line.includes('【前期准备】')) {
        const raw = line.replace(/.*【前期准备】[：:]?\s*/, '').trim()
        // 解析析❶❷❸分隔的道具列表
        const items = raw.split(/(?=[❶❷❸❹❺❻❼❽❾❿])/).filter(Boolean)
        items.forEach((item) => {
          const clean = item.replace(/^[❶❷❸❹❺❻❼❽❾❿]\s*/, '').trim()
          if (clean) preparations.push(clean)
        })
        currentSection = 'preparation'
      } else if (line.includes('【游戏大纲】')) {
        saveRound()
        currentSection = 'outline'
      } else if (line.includes('【游戏白话稿】')) {
        saveRound()
        saveScript()
        currentSection = 'script'
      }
      // 大纲内的轮次：▶❶【第一轮次】
      else if (currentSection === 'outline' && line.match(/▶[❶❷❸❹❺❻❼❽❾❿]/)) {
        saveRound()
        const title = line
          .replace(/▶[❶❷❸❹❺❻❼❽❾❿]\s*/, '')
          .replace(/[：:]$/, '')
          .trim()
        currentRound = { title, props: '', rule: '', safety: '' }
      }
      // 大纲内的子项：▷①②③
      else if (currentSection === 'outline' && currentRound && line.match(/▷[①②③④⑤⑥⑦⑧⑨⑩]/)) {
        if (line.includes('（所需道具）')) {
          currentRound.props = line.replace(/.*（所需道具）[）)]\s*[：:]?\s*/, '').trim()
        } else if (line.includes('（规则简述）')) {
          currentRound.rule = line.replace(/.*（规则简述）[）)]\s*[：:]?\s*/, '').trim()
        } else if (line.includes('（安全提醒）')) {
          currentRound.safety = line.replace(/.*（安全提醒）[）)]\s*[：:]?\s*/, '').trim()
        }
      }
      // 白话稿内的段落：▶❶开场 / ▶❷第一轮
      else if (currentSection === 'script' && line.match(/▶[❶❷❸❹❺❻❼❽❾❿]/)) {
        saveScript()
        const title = line
          .replace(/▶[❶❷❸❹❺❻❼❽❾❿]\s*/, '')
          .replace(/[：:]$/, '')
          .trim()
        currentScript = { title, content: '' }
      }
      // 白话稿内容续行
      else if (currentSection === 'script' && currentScript && line.length > 0) {
        currentScript.content += (currentScript.content ? '\n' : '') + line
      }
    }

    saveRound()
    saveScript()

    // 收集所有安全提醒作为 tips
    rounds.forEach((r) => {
      if (r.safety) tips.push(r.safety)
    })

    // 生成步骤摘要
    const steps = rounds.map((r) => r.rule || r.title)

    return {
      name,
      tag,
      space,
      preparations,
      rounds,
      scripts,
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
            <Text style={{ fontSize: '14px', color: '#ea580c', fontWeight: '500' }}>
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

        {/* 活动空间 */}
        {game.space && (
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
              📍 活动空间
            </Text>
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
          </View>
        )}

        {/* 前期准备 */}
        {game.preparations.length > 0 && (
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
              🎒 前期准备
            </Text>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {game.preparations.map((item, idx) => (
                <Text key={idx} style={{ fontSize: '14px', color: '#4b5563', lineHeight: '22px' }}>
                  📦 {item}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* 游戏大纲 */}
        {game.rounds.length > 0 && (
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
              🎯 游戏大纲
            </Text>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {game.rounds.map((round, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <Text
                    style={{
                      fontSize: '15px',
                      fontWeight: 'bold',
                      color: '#f97316',
                      marginBottom: '10px',
                      display: 'block',
                    }}
                  >
                    🚀 {round.title}
                  </Text>
                  {round.props && (
                    <View style={{ marginBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        🧸 所需道具：
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#374151', lineHeight: '20px' }}>
                        {round.props}
                      </Text>
                    </View>
                  )}
                  {round.rule && (
                    <View style={{ marginBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        📖 规则简述：
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#374151', lineHeight: '20px' }}>
                        {round.rule}
                      </Text>
                    </View>
                  )}
                  {round.safety && (
                    <View>
                      <Text style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        ⚠️ 安全提醒：
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#dc2626', lineHeight: '20px' }}>
                        {round.safety}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 游戏白话稿 */}
        {game.scripts.length > 0 && (
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
              游戏白话稿
            </Text>
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
          </View>
        )}

        {/* 安全提醒汇总 */}
        {game.tips.length > 0 && (
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
              安全提醒
            </Text>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {game.tips.map((tip, idx) => (
                <Text key={idx} style={{ fontSize: '14px', color: '#c2410c', lineHeight: '20px' }}>
                  • {tip}
                </Text>
              ))}
            </View>
          </View>
        )}

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
                <Text style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
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
                    fontSize: '14px',
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
