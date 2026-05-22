import type { Step } from '../../../components/Step'

export type { Step }

/**
 * 向导步骤配置接口
 */
export interface WizardStep extends Step {
  id: number
  label: string
  description?: string
}

/**
 * 创建状态接口
 */
export interface CreationState {
  currentStep: number
  [key: string]: any
}
