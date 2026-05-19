import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Card from '@/components/Card'
import GameDetail from '@/components/GameDetail'
import type { Game } from '@/data/mock/games'

export interface ResultPreviewConfig {
  step: number
  title: string
  previewTemplate?: string
  actions?: Array<{
    label: string
    action: string
    api?: string
  }>
  required?: boolean
}

interface GeneratedResult {
  generated_content: string
  music?: string
  created_at?: string
}

interface ResultPreviewProps {
  config: ResultPreviewConfig
  value: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

/**
 * 解析生成内容文本，提取游戏信息
 */
function parseGeneratedContent(content: string): Partial<Game> {
  const lines = content.split('\n').filter((line) => line.trim())

  let name = '新游戏'
  let category = '益智类'
  let allDescription = ''
  const playSteps: string[] = []
  const preparation: string[] = []

  for (const line of lines) {
    // 提取游戏名称
    if (line.includes('【游戏名称】')) {
      const match = line.match(/【游戏名称】[：:]\s*(.+)/)
      if (match) name = match[1].trim()
    }

    // 提取游戏形式作为分类
    if (line.includes('【游戏形式】')) {
      const match = line.match(/【游戏形式】[：:]\s*(.+)/)
      if (match) category = match[1].trim()
    }

    // 提取前期准备
    if (line.includes('【前期准备】')) {
      const match = line.match(/【前期准备】[：:]\s*(.+)/)
      if (match) {
        const prepText = match[1].trim()
        // 按按❶❷❸等分割
        const items = prepText.split(/[❶❷❸❹❺❻❼❽❾❿⓫⓬]/).filter((item) => item.trim())
        items.forEach((item) => {
          const cleaned = item.replace(/^[：:]\s*/, '').trim()
          if (cleaned) preparation.push(cleaned)
        })
      }
    }

    // 提取游戏大纲中的规则简述作为游戏步骤
    if (line.includes('（规则简述）')) {
      const match = line.match(/（规则简述）[）)]\s*[：:]\s*(.+)/)
      if (match) playSteps.push(match[1].trim())
    }
  }

  // 如果没有提取到描述，使用默认描述
  if (!allDescription) {
    allDescription = `一个有趣的${category}游戏`
  }

  return {
    name,
    category,
    allDescription,
    playSteps:
      playSteps.length > 0 ? playSteps : ['准备游戏道具', '讲解游戏规则', '开始游戏', '游戏结束'],
    preparation: preparation.length > 0 ? preparation : ['游戏道具若干', '足够的活动空间'],
  }
}

/**
 * ResultPreview - 结果预览组件
 *
 * 展示生成的游戏结果列表，点击可查看详情
 */
export default function ResultPreview({ config, value }: ResultPreviewProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  // 获取生成结果列表
  const generatedResults: GeneratedResult[] = value.generatedResults || []
  const hasResults = generatedResults.length > 0

  // 将生成结果转换为 Game 对象
  const games: Game[] = generatedResults.map((result, index) => {
    const parsed = parseGeneratedContent(result.generated_content)
    return {
      id: index + 1,
      name: parsed.name || '新游戏',
      allDescription: parsed.allDescription || '',
      duration: '10分钟',
      players: parseInt(value.playerCount) || 2,
      category: parsed.category || '益智类',
      bgmUrl: result.music || undefined,
      playSteps: parsed.playSteps || [],
      preparation: parsed.preparation || [],
    }
  })

  const handleGameClick = (game: Game) => {
    setSelectedGame(game)
  }

  const handleBack = () => {
    setSelectedGame(null)
  }

  // 如果选中了游戏，显示详情
  if (selectedGame) {
    return <GameDetail game={selectedGame} onBack={handleBack} />
  }

  return (
    <View style={{ padding: '16px', backgroundColor: '#f7f8fa', minHeight: '100vh' }}>
      {/* Header */}
      <View style={{ marginBottom: '16px' }}>
        <Text
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1d2129',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          {config.title || '生成结果'}
        </Text>
        <Text style={{ fontSize: '14px', color: '#4e5969' }}>
          {hasResults ? `共 ${games.length} 个生成结果` : '请先生成游戏'}
        </Text>
      </View>

      {/* 生成结果列表 */}
      {hasResults ? (
        <View>
          {games.map((game, index) => (
            <Card
              key={game.id}
              className="mb-3 cursor-pointer"
              onClick={() => handleGameClick(game)}
            >
              <View style={{ padding: '16px' }}>
                {/* 游戏标题和分类 */}
                <View
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1d2129' }}>
                    {game.name}
                  </Text>
                  <View
                    style={{ padding: '2px 8px', backgroundColor: '#fff3eb', borderRadius: '12px' }}
                  >
                    <Text style={{ fontSize: '12px', color: '#fe6601' }}>{game.category}</Text>
                  </View>
                </View>

                {/* 游戏描述 */}
                <Text
                  style={{
                    fontSize: '14px',
                    color: '#4e5969',
                    marginBottom: '12px',
                    lineHeight: '20px',
                  }}
                >
                  {game.allDescription.length > 50
                    ? game.allDescription.slice(0, 50) + '...'
                    : game.allDescription}
                </Text>

                {/* 游戏信息 */}
                <View style={{ display: 'flex', gap: '12px' }}>
                  <Text style={{ fontSize: '12px', color: '#86909c' }}>{game.players}人</Text>
                  <Text style={{ fontSize: '12px', color: '#86909c' }}>{game.duration}</Text>
                  {game.playSteps.length > 0 && (
                    <Text style={{ fontSize: '12px', color: '#86909c' }}>
                      {game.playSteps.length}个步骤
                    </Text>
                  )}
                </View>

                {/* 生成时间 */}
                {generatedResults[index]?.created_at && (
                  <Text
                    style={{
                      fontSize: '11px',
                      color: '#c9cdd4',
                      marginTop: '8px',
                      display: 'block',
                    }}
                  >
                    生成于 {new Date(generatedResults[index].created_at).toLocaleString()}
                  </Text>
                )}
              </View>
            </Card>
          ))}
        </View>
      ) : (
        /* 空状态 */
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '80px',
          }}
        >
          <Text style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</Text>
          <Text style={{ fontSize: '16px', color: '#86909c' }}>暂无生成结果</Text>
          <Text style={{ fontSize: '14px', color: '#c9cdd4', marginTop: '8px' }}>请先生成游戏</Text>
        </View>
      )}
    </View>
  )
}
