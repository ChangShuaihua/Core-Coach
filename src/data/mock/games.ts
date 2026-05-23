export type Game = {
  id: number
  record_id: number
  game_name: string
  game_type: string
  collected_at: string
  name?: string
  allDescription?: string
  duration?: string
  players?: number
  category?: string
  bgmUrl?: string
  playSteps?: string[]
  preparation: string[]
  generated_content?: string
  music?: string
  age?: number
}

export const mockGames: Game[] = [
  {
    id: 1,
    name: '自然探索',
    allDescription: '学生围着规定路线跑，拿着小飞盘',
    duration: '10分钟',
    players: 2,
    category: '益智类',
    bgmUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    playSteps: [
      '刮大风了把小飞盘举高，下大雨了躲到跳箱下',
      '在第二段基础上，加出彩虹了把小飞盘抛向空中',
      '小朋友们，我们今天来玩一个自然探索的游戏，拿着这些花朵在小山周围走走吧。',
      '当我说刮大风了，那你们就要把花朵高高举起哦（试一次）刮大风了，快把小飞盘举高。当我说下大雨了，那你们就要赶紧躲到小山下面（试一次）下大雨了，快躲到跳箱下。',
      '现在我们跑累了，休息一下，那我问一下，刮完大风，下完大雨，该干啥啦？（出彩虹）对，没错，当我说出彩虹了，你们要把花朵抛向空中，都明白了吗？（明白），现在我们继续拿着花朵走小山，刮大风了，快把小飞盘举高（做完），好，现在风停了，继续跑起来，下大雨了，快躲到跳箱下（跑 1-2 圈），出彩虹了，快把小飞盘抛向空中（做完），下雨了，快躲到跳箱下，出彩虹了，快把小飞盘抛向空中（再重复 1-2 次），ok 所有小朋友今天的探索完成了，我们来休息一下。',
      '现在我们跑累了，休息一下，那我问一下，刮完大风，下完大雨，该干啥啦？（出彩虹）对，没错，当我说出彩虹了，你们要把花朵抛向空中，都明白了吗？（明白），现在我们继续拿着花朵走小山，刮大风了，快把小飞盘举高（做完），好，现在风停了，继续跑起来，下大雨了，快躲到跳箱下（跑 1-2 圈），出彩虹了，快把小飞盘抛向空中（做完），下雨了，快躲到跳箱下，出彩虹了，快把小飞盘抛向空中（再重复 1-2 次），ok 所有小朋友今天的探索完成了，我们来休息一下。',
    ],
    preparation: ['飞盘若干', '障碍物若干'],
    game_name: '自然探索',
    collected_at: '2023-01-01',
    game_type: '益智类',
    age: 5,
    generated_content: '学生围着规定路线跑，拿着小飞盘，探索不同的环境',
    music: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    record_id: 1,
  },
  {
    id: 2,
    name: '自然探索',
    allDescription: '学生围着规定路线跑，拿着小飞盘',
    duration: '10分钟',
    players: 2,
    category: '益智类',
    bgmUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    playSteps: [
      '刮大风了把小飞盘举高，下大雨了躲到跳箱下',
      '在第二段基础上，加出彩虹了把小飞盘抛向空中',
      '小朋友们，我们今天来玩一个自然探索的游戏，拿着这些花朵在小山周围走走吧。',
      '当我说刮大风了，那你们就要把花朵高高举起哦（试一次）刮大风了，快把小飞盘举高。当我说下大雨了，那你们就要赶紧躲到小山下面（试一次）下大雨了，快躲到跳箱下。',
      '现在我们跑累了，休息一下，那我问一下，刮完大风，下完大雨，该干啥啦？（出彩虹）对，没错，当我说出彩虹了，你们要把花朵抛向空中，都明白了吗？（明白），现在我们继续拿着花朵走小山，刮大风了，快把小飞盘举高（做完），好，现在风停了，继续跑起来，下大雨了，快躲到跳箱下（跑 1-2 圈），出彩虹了，快把小飞盘抛向空中（做完），下雨了，快躲到跳箱下，出彩虹了，快把小飞盘抛向空中（再重复 1-2 次），ok 所有小朋友今天的探索完成了，我们来休息一下。',
      '现在我们跑累了，休息一下，那我问一下，刮完大风，下完大雨，该干啥啦？（出彩虹）对，没错，当我说出彩虹了，你们要把花朵抛向空中，都明白了吗？（明白），现在我们继续拿着花朵走小山，刮大风了，快把小飞盘举高（做完），好，现在风停了，继续跑起来，下大雨了，快躲到跳箱下（跑 1-2 圈），出彩虹了，快把小飞盘抛向空中（做完），下雨了，快躲到跳箱下，出彩虹了，快把小飞盘抛向空中（再重复 1-2 次），ok 所有小朋友今天的探索完成了，我们来休息一下。',
    ],
    preparation: ['飞盘若干', '障碍物若干'],
    game_name: '自然探索',
    collected_at: '2023-01-01',
    game_type: '益智类',
    age: 5,
    record_id: 2,
    generated_content: '学生围着规定路线跑，拿着小飞盘，探索不同的环境',
    music: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
]
