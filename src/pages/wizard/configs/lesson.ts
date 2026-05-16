import LessonPlanCard from '../components/LessonPlan'
import MovementSelectorCard from '../components/MovementSelector'
import type { WizardConfig } from '../types/wizard'

/**
 * 教案生成配置（跑酷教学）
 * 2 步：动作选择 → 教案预览
 *
 * 第一步：选择教学动作、人数、年龄段
 * 第二步：预览生成的教案
 */
export const LESSON_GENERATION_CONFIG: WizardConfig = {
  steps: [
    {
      id: 'movement',
      label: '选动作',
      description: '选择教学动作和参数',
      requiredFields: ['selectedMovements', 'playerCount', 'difficulty'],
      validationMessage: '请完成动作选择和参数设置',
    },
    {
      id: 'lesson',
      label: '生成教案',
      description: '预览生成的教案',
      // 预览步骤不需要验证
    },
  ],
  contentComponents: [MovementSelectorCard, LessonPlanCard],
}
