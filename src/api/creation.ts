import gameIcon from '@/assets/images/icon.png'
import type {
  Skill,
  GenerateGameParams,
  GenerateGameResult,
  GameParamsResponse,
  MusicListRequest,
  MusicListData,
  MusicSelectRequest,
  ApiResponse,
  GenerateTaskResponse,
  GenerateTaskResult,
} from '@/types/creation'
import { post, get } from '../services/http'

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
/**
 * 获取技能列表（创作工坊）
 * 接口: GET /creation/skills
 * 返回: { code: 0, message: "成功", data: { list: Skill[] } }
 */
export const getSkillList = async (): Promise<Skill[]> => {
  // 调用真实接口
  const res = await get<{ list: Skill[] }>('/creation/skills')

  // 接口返回格式: { code: 0, message: "成功", data: { list: [...] } }
  // res.data 就是接口返回的 data 字段
  const skillList = res.data?.list || []

  // 处理图标：如果后端返回空字符串，使用默认图标
  const processedList = skillList.map((skill) => ({
    ...skill,
    icon: skill.icon || getDefaultIcon(skill.id),
  }))

  // 始终在末尾添加"更多功能"卡片
  return [...processedList, MORE_SKILL]
}

// 根据技能ID获取默认图标
function getDefaultIcon(skillId: number): string {
  switch (skillId) {
    case 1:
      return gameIcon // 游戏生成
    case 4:
      return '📋' // 教案生成
    case 5:
      return '🎬' // 视频分析
    default:
      return '✨'
  }
}

/**
 * 获取技能详情（向导配置）
 * 接口: GET /creation/skills/:id
 * 返回: { code: 0, message: "成功", data: { step_config, name, ... } }
 */
export const getSkillDetail = async (id: number) => {
  const result = await get(`/creation/skills/${id}`)
  // 返回 data 字段的内容
  return result.data
}

// 获取参数
export const getGameParams = async (): Promise<GameParamsResponse> => {
  const result = await get<GameParamsResponse>('/creation/game/params')
  return result.data
}
/**
 * 生成游戏
 * 接口: POST /game/generate
 * 返回: { code, message, data: { record_id, age, game_type, scene_template, game_name, generated_content, music, created_at } }
 */
export const generateGame = async (params: GenerateGameParams): Promise<GenerateGameResult> => {
  const res = await post<GenerateGameResult>('/game/generate', params)
  // 返回 data 字段的内容
  return res.data
}

/**
 * 获取音乐列表（更换音乐页面）
 * 接口: GET /game/music/options
 * 请求参数: { record_id?: number }
 * 返回: { code, message, data: { current_music, music_list } }
 */
export const getMusicList = async (params?: MusicListRequest): Promise<MusicListData> => {
  const res = await get<MusicListData>('/game/music/options', params)
  return res.data
}

/**
 * 确认选择的音乐
 * 接口: POST /game/music/select
 * 请求参数: { music_id: number, record_id: number }
 * 返回: { code, message, data }
 */
export const selectMusic = async (params: MusicSelectRequest): Promise<ApiResponse> => {
  const res = await post<ApiResponse>('/game/music/select', params)
  return res.data
}

/**
 * 统一生成接口映射表
 * 根据业务类型动态分发到对应的 API
 */
export const generateApiMap: Record<string, (data: any) => Promise<any>> = {
  game: generateGame,
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
 * 启动生成任务（异步）
 * 接口: POST /game/generate
 * 返回: { code, message, data: { record_id, status, status_text, estimated_seconds, message } }
 */
export const startGenerateTask = async (
  params: GenerateGameParams
): Promise<GenerateTaskResponse> => {
  const res = await post<GenerateTaskResponse>('/game/generate', params)
  return res.data
}

/**
 * 查询任务状态和结果
 * 接口: GET /game/detail?record_id=xx
 * 返回: { code, message, data: { record_id, status, status_text, ... } }
 */
export const getTaskStatus = async (recordId: number): Promise<GenerateTaskResult> => {
  const res = await get<GenerateTaskResult>('/game/detail', { record_id: String(recordId) })
  return res.data
}
