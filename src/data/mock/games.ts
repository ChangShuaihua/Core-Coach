export type Game = {
  id: number
  name: string
  description: string
  duration: string
  players: number
  category: string
}

export const mockGames: Game[] = [
  {
    id: 1,
    name: '数字猜猜乐',
    description: '通过提问猜测数字',
    duration: '10分钟',
    players: 2,
    category: '益智类',
  },
  {
    id: 2,
    name: '词语接龙',
    description: '根据词语最后一字接龙',
    duration: '15分钟',
    players: 4,
    category: '语言类',
  },
  {
    id: 3,
    name: '你画我猜',
    description: '通过绘画猜词语',
    duration: '20分钟',
    players: 4,
    category: '创意类',
  },
  {
    id: 4,
    name: '角色扮演',
    description: '模拟真实场景，玩家扮演角色',
    duration: '30分钟',
    players: 4,
    category: '角色扮演',
  },
]

export const mockGamesDetail: Record<number, Game> = {
  1: {
    id: 1,
    name: '数字猜猜乐',
    description:
      '通过提问猜测数字。一人想一个数字，其他人通过提问来猜测这个数字。可以设定范围，增加难度。适合儿童数学启蒙，锻炼逻辑思维能力。',
    duration: '10分钟',
    players: 2,
    category: '益智类',
  },
  2: {
    id: 2,
    name: '词语接龙',
    description:
      '根据词语最后一字接龙。参与者依次说出一个词语，要求每个词语的第一个字必须与上一个词语的最后一个字相同。可以设定时间限制，增加趣味性。',
    duration: '15分钟',
    players: 4,
    category: '语言类',
  },
  3: {
    id: 3,
    name: '你画我猜',
    description:
      '通过绘画猜词语。一人作画，其他人根据画作猜测对应的词语。考验绘画技巧和想象力，非常适合家庭聚会或朋友间娱乐。',
    duration: '20分钟',
    players: 4,
    category: '创意类',
  },
  4: {
    id: 4,
    name: '角色扮演',
    description:
      '模拟真实场景，玩家扮演角色。可以设定各种场景如超市购物、医院看病等，让孩子体验不同职业和社会角色，培养同理心。',
    duration: '30分钟',
    players: 4,
    category: '角色扮演',
  },
}
