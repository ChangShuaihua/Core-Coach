import { QuickAction } from '../types/index'

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'action-points',
    title: '动作要点解读',
    prompt: '请帮我解读这个动作的要点',
  },
  {
    id: 'course-qa',
    title: '课程问答',
    prompt: '我想了解课程相关的问题',
  },
  {
    id: 'action-level',
    title: '动作升降级',
    prompt: '如何进行动作升降级？',
  },
]
