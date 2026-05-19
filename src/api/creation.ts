import type { Skill } from '@/pages/creation/constants/skills'
import { post, get } from '../services/http'

const isDev = process.env.NODE_ENV === 'development'
// 强制使用 mock 数据（开发时可设置为 true 避免网络请求）
const FORCE_MOCK = true

// 默认的「更多功能」卡片，始终追加在列表末尾
const MORE_SKILL: Skill = {
  id: 9999,
  flow_id: '',
  description: '更多功能',
  icon: '➕',
  image_need: 0,
  step_count: 0,
  status: 0,
}

const mockSkillList: Skill[] = [
  {
    id: 1,
    flow_id: '7610696574318297103',
    description: '游戏生成',
    icon: '🎮',
    image_need: 0,
    step_count: 5,
    status: 1,
  },
  {
    id: 2,
    flow_id: '7610696574318297104',
    description: '教案生成',
    icon: '📋',
    image_need: 0,
    step_count: 4,
    status: 2,
  },
  {
    id: 3,
    flow_id: '7610696574318297105',
    description: '视频分析',
    icon: '🎬',
    image_need: 1,
    step_count: 3,
    status: 2,
  },
]

interface SkillListResponse {
  list: Skill[]
}

export interface GameType {
  name: string
  code: string
  status: number
}

export interface AgeConfig {
  min: number
  max: number
  default: number
  unit: string
}

export interface GameConfig {
  game_types: GameType[]
  age_config: AgeConfig
}

const mockGameConfig: GameConfig = {
  game_types: [
    { name: '折返式', code: 'zhefan', status: 1 },
    { name: '循环式', code: 'loop', status: 1 },
    { name: '散点式', code: 'scatter', status: 1 },
  ],
  age_config: {
    min: 3,
    max: 12,
    default: 3,
    unit: '岁',
  },
}

/**
 * 获取技能列表（创作工坊）
 * 接口: GET /creation/skills
 * 返回: { code, message, data: { list: Skill[] } }
 */
export const getSkillList = async (): Promise<Skill[]> => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 技能列表')
    return Promise.resolve([...mockSkillList, MORE_SKILL])
  }

  try {
    const res = await get<SkillListResponse>('/creation/skills', undefined, {
      showLoading: true,
    })
    return [...res.list, MORE_SKILL]
  } catch (error) {
    console.error('获取技能列表失败:', error)

    if (isDev) {
      console.warn('开发环境：使用 mock 数据替代')
      return [...mockSkillList, MORE_SKILL]
    }

    throw error
  }
}

/**
 * 获取技能详情（向导配置）
 * 接口: GET /creation/skills/:id
 * 返回: { code, message, data: { step_config, name, ... } }
 */
export const getSkillDetail = async (id: number) => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 技能ID:', id)
    const { getMockSkillConfig } = await import('@/pages/wizard/constants/skillConfig')
    const mode = id === 1 ? 'game' : id === 2 ? 'lesson' : 'game'
    return getMockSkillConfig(mode)
  }

  try {
    const result = await get(`/creation/skills/${id}`, undefined, {
      showLoading: true,
    })
    return result
  } catch (error) {
    console.error('获取技能详情失败:', error)

    if (isDev) {
      console.warn('⚠️ 网络请求失败，使用 mock 数据替代')
      const { getMockSkillConfig } = await import('@/pages/wizard/constants/skillConfig')
      const mode = id === 1 ? 'game' : id === 2 ? 'lesson' : 'game'
      return getMockSkillConfig(mode)
    }

    throw error
  }
}

/**
 * 生成游戏
 * 接口: POST /game/generate
 * 返回: { code, message, data: { record_id, age, game_type, scene_template, game_name, generated_content, music, created_at } }
 */
export interface GenerateGameParams {
  age: number
  game_type: string
  player_count?: number
}

export interface GenerateGameResult {
  record_id: number
  age: number
  game_type: string
  scene_template: string
  game_name: string
  generated_content: string
  music: string
  created_at: string
}

const mockGenerateResult: GenerateGameResult = {
  record_id: 3,
  age: 3,
  game_type: '循环式',
  scene_template: '森林冒险',
  game_name: '小兔子跳跳的森林寻宝大冒险',
  generated_content: `<输出格式>
1️⃣【游戏名称】：小兔子跳跳的森林寻宝大冒险
2️⃣【游戏形式】：散点式
3️⃣【活动空间】：体能教室≥50㎡（有效活动区域≥40㎡，清空中央区域，四周摆放器械）
4️⃣【前期准备】：❶三角架：3个（2个升降三角架+1个长三角架）；❷黄色布条：1个；❸蓝色布条：1个；❹绿色布条：1个；❺绿色布垫：1个；❻红色草莓：泡沫道具；❼彩色卡纸：魔法花瓣；❽蓝色布垫：1个；❾圆石头：光滑鹅卵石道具；❿铃铛石子：亮闪闪石头；⓫会说话的橡果：带声音的玩具橡果；⓬魔法橡果
5️⃣【游戏大纲】：
     ▶❶【第一轮次】：
             ▷①（所需道具）：升降三角架（矮）：1个，黄色布条：1个，绿色布垫：1个，红色草莓：泡沫道具，彩色卡纸：魔法花瓣
             ▷②（规则简述）：从起点并脚跳5米到蘑菇屋，弯腰钻过升降三角架下方5米，在绿色布垫找红色草莓交给松鼠奶奶，获得魔法花瓣并脚跳回起点10米
             ▷③（安全提醒）：钻爬时头低下，不推挤前面的小兔子；跳的时候脚尖落地轻轻跳
     ▶❷【第二轮次】：
             ▷①（所需道具）：升降三角架（矮）：1个，蓝色布条：1个，蓝色布垫：1个，圆石头：光滑鹅卵石道具2颗，铃铛石子：亮闪闪石头
             ▷②（规则简述）：持花瓣并脚跳10米到小溪边，跨过横向放倒的升降三角架3步（每跨1步数1个数），在蓝色布垫找2颗圆石头交给小青蛙，获得亮闪闪石头慢跑回起点20米
             ▷③（安全提醒）：跨跳时脚抬高，落地站稳再走；石头要轻轻拿，不扔不摔
     ▶❸【第三轮次】：
             ▷①（所需道具）：长三角架（高）：1个，绿色布条：1个，会说话的橡果：带声音的玩具橡果1颗，魔法橡果
             ▷②（规则简述）：持石头和花瓣快速跑15米到橡树林，围绕长三角架绕跑3圈（边跑边说"左绕绕/右绕绕"），在绿色布条覆盖区找1颗会说话的橡果交给猫头鹰爷爷，获得魔法橡果并脚跳回中央集合点10米
             ▷③（安全提醒）：绕跑时保持距离，不撞到"大树"；蹲下拾橡果时慢慢起身
6️⃣【游戏白话稿】：
     ▶❶开场：宝宝们看！今天我们都是小兔子跳跳（分发兔子头饰），要去森林里帮妈妈找魔法礼物哦！森林里有蘑菇屋、小溪和橡树林，每个地方都有朋友等着我们帮忙～拿到花瓣、石头和橡果，就能变出彩虹糖啦！现在我们先活动活动小脚丫（带领做原地踏步+脚踝转动），准备出发！
     ▶❷第一轮：小兔子们好呀！我是松鼠奶奶～我的草莓掉在草丛里啦，红色的哦！你们能钻过蘑菇屋的小门（指三角架下方），帮我找回来吗？找到的宝宝会得到会发光的花瓣哦！跳的时候要像小兔子一样，脚尖轻轻碰地～
     ▶❸第二轮：呱呱！小兔子们带着花瓣来啦！小溪里的石头堆倒了，我需要3颗石头才能搭凳子～你们看（指三角架），跨过这块大石头，然后在蓝色的溪边找2颗圆石头给我，就能拿到会唱歌的石头啦！跨的时候脚要抬高，像小青蛙跳荷叶一样哦！
     ▶❹第三轮：呼——小兔子们真棒！我的橡果藏在树叶下面啦（指绿色布条）！你们先绕着大树跑3圈（示范绕三角架跑），边跑边说"左绕绕"，然后蹲下来翻开树叶找橡果～找到的宝宝就能拿到会说话的橡果啦！跑的时候不要撞到大树，慢慢跑哦！
     ▶❺结束：哇！所有小兔子都集齐了3件礼物（展示花瓣/石头/橡果）！现在请把礼物放进中间的魔法篮子里——1、2、3，变！（从篮子里拿出彩虹糖贴纸）这是你们勇敢冒险的奖励！今天我们钻过了蘑菇屋、跨过了小溪、绕着大树跑，还认识了红色草莓、圆石头和树叶下面的橡果，是不是超级棒？下次我们还可以去森林探险哦！现在轻轻拍拍小胳膊、小腿，放松一下吧～
<格式结束>`,
  music:
    'https://lf-bot-studio-plugin-resource.coze.cn/obj/bot-studio-platform-plugin-tos/artist/image/5d38e140a0c147339544a50d4bc501c7.wav',
  created_at: '2026-05-14T09:13:39.816+08:00',
}

export const generateGame = async (params: GenerateGameParams): Promise<GenerateGameResult> => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 生成游戏:', params)
    return Promise.resolve(mockGenerateResult)
  }

  try {
    const res = await post<GenerateGameResult>('/game/generate', params, {
      showLoading: true,
    })
    return res
  } catch (error) {
    console.error('生成游戏失败:', error)

    if (isDev) {
      console.warn('开发环境：使用 mock 数据替代')
      return mockGenerateResult
    }

    throw error
  }
}

/**
 * 生成教案
 * 接口: POST /lesson/generate
 */
export interface GenerateLessonParams {
  sport_type: string
  age: number
  duration?: number
}

export interface GenerateLessonResult {
  record_id: number
  title: string
  sport_type: string
  content: string
  created_at: string
}

const mockLessonResult: GenerateLessonResult = {
  record_id: 1,
  title: '跑步基础教学教案',
  sport_type: '跑步',
  content: '这是一份跑步基础教学教案...',
  created_at: '2026-05-14T10:00:00.000+08:00',
}

export const generateLesson = async (
  params: GenerateLessonParams
): Promise<GenerateLessonResult> => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 生成教案:', params)
    return Promise.resolve(mockLessonResult)
  }

  try {
    const res = await post<GenerateLessonResult>('/lesson/generate', params, {
      showLoading: true,
    })
    return res
  } catch (error) {
    console.error('生成教案失败:', error)

    if (isDev) {
      console.warn('开发环境：使用 mock 数据替代')
      return mockLessonResult
    }

    throw error
  }
}

/**
 * 统一生成接口映射表
 * 根据业务类型动态分发到对应的 API
 */
export const generateApiMap: Record<string, (data: any) => Promise<any>> = {
  game: generateGame,
  lesson: generateLesson,
}

/**
 * 统一生成函数
 * 根据业务类型自动调用对应的接口
 */
export const generateByType = async (businessType: string, data: Record<string, any>) => {
  const generateFn = generateApiMap[businessType]
  if (!generateFn) {
    throw new Error(`不支持的业务类型: ${businessType}`)
  }
  return await generateFn(data)
}

/**
 * 获取游戏配置（游戏类型 + 年龄配置）
 * 接口: GET /creation/game-config
 * 返回: { code, message, data: { game_types, age_config } }
 */
export const getGameConfig = async (): Promise<GameConfig> => {
  if (FORCE_MOCK && isDev) {
    console.log('🎭 使用 Mock 数据 - 游戏配置')
    return Promise.resolve(mockGameConfig)
  }

  try {
    const res = await get<GameConfig>('/creation/game-config', undefined, {
      showLoading: true,
    })
    return res
  } catch (error) {
    console.error('获取游戏配置失败:', error)

    if (isDev) {
      console.warn('开发环境：使用 mock 数据替代')
      return mockGameConfig
    }

    throw error
  }
}
