import MusicSettingsCard from '../../creation/components/MusicSettings'
import ParamSettingsCard from '../components/game/ParamSettings'
import ResultPreviewCard from '../components/game/ResultPreview'
import TemplateSelectorCard from '../components/game/TemplateSelector'
import type { WizardConfig } from '../types/wizard'

/**
 * 游戏创作配置
 * 4 步：模板 → 参数 → 结果 → 音乐
 *
 * 只需要配置：
 * 1. steps - 步骤文字
 * 2. contentComponents - 对应的卡片组件
 */
export const GAME_CREATION_CONFIG: WizardConfig = {
  steps: [
    {
      id: 'template',
      label: '选模板',
      description: '选择游戏模板',
      requiredFields: ['selectedTemplate'],
      validationMessage: '请选择一个游戏模板',
    },
    {
      id: 'params',
      label: '参数设置',
      description: '配置游戏参数',
      requiredFields: ['gameName', 'age', 'playerCount'],
      validationMessage: '请完成游戏参数设置',
    },
    {
      id: 'preview',
      label: '生成结果',
      description: '预览游戏规则',
      // 预览步骤不需要验证，因为是展示生成的结果
    },
    {
      id: 'music',
      label: '音乐音效',
      description: '配置音乐音效',
      // 音乐设置是可选的，不需要验证
    },
  ],
  contentComponents: [
    TemplateSelectorCard,
    ParamSettingsCard,
    ResultPreviewCard,
    MusicSettingsCard,
  ],
}
