export interface Round {
  title: string
  props: string
  rule: string
  safety: string
}

export interface Script {
  title: string
  content: string
}

export interface ParsedGame {
  name: string
  tag: string
  space: string
  preparations: string[]
  rounds: Round[]
  scripts: Script[]
  steps: string[]
  tips: string[]
}

const GAME_EMOJI_MAP: Record<string, string> = {
  团队: '🐿️',
  竞技: '🦁',
  冒险: '🏴‍☠️',
  益智: '🧩',
  运动: '⚽',
  表演: '🎭',
  手工: '🎨',
}

export function getGameEmoji(gameType: string): string {
  for (const [key, emoji] of Object.entries(GAME_EMOJI_MAP)) {
    if (gameType.includes(key)) return emoji
  }
  return '🎮'
}

export function parseGameContent(content: string): ParsedGame {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let name = '新生成游戏'
  let tag = '团队游戏'
  let space = ''
  const preparations: string[] = []
  const rounds: Round[] = []
  const scripts: Script[] = []
  const tips: string[] = []

  let currentSection = ''
  let currentRound: Round | null = null
  let currentScript: Script | null = null

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
    if (line.startsWith('<输出格式>') || line.startsWith('<格式结束>')) continue

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
    } else if (currentSection === 'outline' && line.match(/▶[❶❷❸❹❺❻❼❽❾❿]/)) {
      saveRound()
      const title = line
        .replace(/▶[❶❷❸❹❺❻❼❽❾❿]\s*/, '')
        .replace(/[：:]$/, '')
        .trim()
      currentRound = { title, props: '', rule: '', safety: '' }
    } else if (currentSection === 'outline' && currentRound && line.match(/▷[①②③④⑤⑥⑦⑧⑨⑩]/)) {
      if (line.includes('（所需道具）')) {
        currentRound.props = line.replace(/.*（所需道具）[）)]\s*[：:]?\s*/, '').trim()
      } else if (line.includes('（规则简述）')) {
        currentRound.rule = line.replace(/.*（规则简述）[）)]\s*[：:]?\s*/, '').trim()
      } else if (line.includes('（安全提醒）')) {
        currentRound.safety = line.replace(/.*（安全提醒）[）)]\s*[：:]?\s*/, '').trim()
      }
    } else if (currentSection === 'script' && line.match(/▶[❶❷❸❹❺❻❼❽❾❿]/)) {
      saveScript()
      const title = line
        .replace(/▶[❶❷❸❹❺❻❼❽❾❿]\s*/, '')
        .replace(/[：:]$/, '')
        .trim()
      currentScript = { title, content: '' }
    } else if (currentSection === 'script' && currentScript && line.length > 0) {
      currentScript.content += (currentScript.content ? '\n' : '') + line
    }
  }

  saveRound()
  saveScript()

  rounds.forEach((r) => {
    if (r.safety) tips.push(r.safety)
  })

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
