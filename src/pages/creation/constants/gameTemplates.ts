import type { GameTemplate } from '../components/TemplateSelector'

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'forest-adventure',
    name: '森林冒险模板',
    description: '适合户外场景，趣味探索',
    image: 'https://via.placeholder.com/300x200?text=Forest+Adventure',
    category: 'outdoor',
    tags: ['户外', '探索', '冒险'],
    isNew: false,
  },
  {
    id: 'castle-quest',
    name: '城堡探险模板',
    description: '适合室内场景，美不胜收',
    image: 'https://via.placeholder.com/300x200?text=Castle+Quest',
    category: 'castle',
    tags: ['城堡', '探险', '魔法'],
    isNew: true,
  },
  {
    id: 'space-explorer',
    name: '太空探索模板',
    description: '科幻主题，完美想象力',
    image: 'https://via.placeholder.com/300x200?text=Space+Explorer',
    category: 'space',
    tags: ['科幻', '太空', '冒险'],
    isNew: false,
  },
  {
    id: 'ocean-mystery',
    name: '海洋探险模板',
    description: '海洋主题，趣味互动',
    image: 'https://via.placeholder.com/300x200?text=Ocean+Mystery',
    category: 'ocean',
    tags: ['海洋', '探险', '生物'],
    isNew: false,
  },
]

export const TEMPLATE_CATEGORIES = {
  outdoor: '户外冒险',
  castle: '城堡探险',
  space: '太空探索',
  ocean: '海洋探险',
} as const

export const TEMPLATE_FEATURES = {
  'forest-adventure': {
    difficulty: 'easy',
    duration: '15-20分钟',
    players: '1-4人',
    ageGroup: '4-8岁',
  },
  'castle-quest': {
    difficulty: 'medium',
    duration: '20-30分钟',
    players: '1-6人',
    ageGroup: '5-10岁',
  },
  'space-explorer': {
    difficulty: 'medium',
    duration: '20-25分钟',
    players: '1-4人',
    ageGroup: '6-12岁',
  },
  'ocean-mystery': {
    difficulty: 'easy',
    duration: '15-25分钟',
    players: '1-6人',
    ageGroup: '4-10岁',
  },
} as const
