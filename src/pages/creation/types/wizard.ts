/**
 * 通用向导系统 - 最简单的类型定义
 * 所有多步骤页面（游戏、教案、问卷...）都用这套
 */

export interface WizardStep {
  id: string
  label: string
  description?: string
}

export interface WizardConfig {
  steps: WizardStep[]
  contentComponents: React.ComponentType<any>[] // 按步骤顺序排列的内容卡片
}

export interface WizardState {
  currentStepIndex: number
  data: Record<string, any>
}
