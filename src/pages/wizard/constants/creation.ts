import type { CreationStep } from '../types'

export const CREATION_STEPS: CreationStep[] = [
  {
    id: 'props',
    label: '选道具',
    description: '选择道具',
  },
  {
    id: 'template',
    label: '选模板',
    description: '选择模板',
  },
  {
    id: 'params',
    label: '参数设置',
    description: '设置参数',
  },
  {
    id: 'preview',
    label: '生成结果',
    description: '预览结果',
  },
  {
    id: 'music',
    label: '音乐音效',
    description: '配置音乐',
  },
]

export const STEP_ORDER: Record<CreationStep['id'], number> = {
  props: 0,
  template: 1,
  params: 2,
  preview: 3,
  music: 4,
}
