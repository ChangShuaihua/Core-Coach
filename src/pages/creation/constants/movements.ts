/**
 * 跑酷教学动作库
 * 支持按年龄段和难度筛选
 */

export interface Movement {
  id: string
  name: string
  emoji: string
  difficulty: 'easy' | 'medium' | 'hard'
  ageGroups: ('3-6' | '6-8' | '8-10')[]
  description: string
}

export const MOVEMENTS: Movement[] = [
  // 初级动作
  {
    id: 'walk',
    name: '走',
    emoji: '🚶',
    difficulty: 'easy',
    ageGroups: ['3-6', '6-8', '8-10'],
    description: '基础行走动作',
  },
  {
    id: 'run',
    name: '跑',
    emoji: '🏃',
    difficulty: 'easy',
    ageGroups: ['3-6', '6-8', '8-10'],
    description: '基础跑步动作',
  },
  {
    id: 'jump',
    name: '跳',
    emoji: '⛹️',
    difficulty: 'easy',
    ageGroups: ['3-6', '6-8', '8-10'],
    description: '原地跳跃',
  },
  {
    id: 'crawl',
    name: '爬行',
    emoji: '�',
    difficulty: 'easy',
    ageGroups: ['3-6', '6-8', '8-10'],
    description: '四肢爬行动作',
  },
  {
    id: 'balance-walk',
    name: '平衡走',
    emoji: '�‍♂️',
    difficulty: 'easy',
    ageGroups: ['6-8', '8-10'],
    description: '在平衡木上行走',
  },

  // 中级动作
  {
    id: 'forward-roll',
    name: '前滚翻',
    emoji: '�',
    difficulty: 'medium',
    ageGroups: ['6-8', '8-10'],
    description: '向前翻滚',
  },
  {
    id: 'backward-roll',
    name: '后滚翻',
    emoji: '🤸‍♀️',
    difficulty: 'medium',
    ageGroups: ['8-10'],
    description: '向后翻滚',
  },
  {
    id: 'handstand',
    name: '倒立',
    emoji: '🙃',
    difficulty: 'medium',
    ageGroups: ['8-10'],
    description: '手倒立动作',
  },
  {
    id: 'cartwheel',
    name: '侧翻',
    emoji: '🤸‍♂️',
    difficulty: 'medium',
    ageGroups: ['8-10'],
    description: '侧向翻滚',
  },
  {
    id: 'vault',
    name: '跳跃翻越',
    emoji: '🏃‍♂️',
    difficulty: 'medium',
    ageGroups: ['6-8', '8-10'],
    description: '跳过障碍物',
  },

  // 高级动作
  {
    id: 'wall-run',
    name: '墙跑',
    emoji: '🧗',
    difficulty: 'hard',
    ageGroups: ['8-10'],
    description: '沿墙面奔跑',
  },
  {
    id: 'precision-jump',
    name: '精准跳跃',
    emoji: '🎯',
    difficulty: 'hard',
    ageGroups: ['8-10'],
    description: '精准落地跳跃',
  },
  {
    id: 'swing',
    name: '摆荡',
    emoji: '🤾',
    difficulty: 'hard',
    ageGroups: ['8-10'],
    description: '利用杆子摆荡',
  },
  {
    id: 'flip',
    name: '翻腾',
    emoji: '🌀',
    difficulty: 'hard',
    ageGroups: ['8-10'],
    description: '空中翻腾',
  },
]

export const AGE_GROUPS = [
  { id: '3-6', label: '3-6岁', emoji: '👶' },
  { id: '6-8', label: '6-8岁', emoji: '👧' },
  { id: '8-10', label: '8-10岁', emoji: '👦' },
] as const

export const DIFFICULTY_LABELS = {
  easy: '初级',
  medium: '中级',
  hard: '高级',
} as const
