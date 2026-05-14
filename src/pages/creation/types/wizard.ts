/**
 * 通用向导系统 - 最简单的类型定义
 * 所有多步骤页面（游戏、教案、问卷...）都用这套
 */

export interface ValidationResult {
  isValid: boolean
  message?: string
}

export interface WizardStep {
  id: string
  label: string
  description?: string
  // 验证相关
  requiredFields?: string[] // 必填字段列表
  validationMessage?: string // 验证失败时的提示信息
  validate?: (data: Record<string, any>) => ValidationResult // 自定义验证函数
}

export interface WizardConfig {
  steps: WizardStep[]
  contentComponents: React.ComponentType<any>[] // 按步骤顺序排列的内容卡片
}

export interface WizardState {
  currentStepIndex: number
  data: Record<string, any>
}
