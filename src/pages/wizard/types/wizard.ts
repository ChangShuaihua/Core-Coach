/**
 * 动态向导系统 - 支持后台配置的多步骤表单
 */

export interface StepConfig {
  step: number
  title: string
  type:
    | 'selector'
    | 'template_grid'
    | 'form'
    | 'radio_group'
    | 'image_upload'
    | 'slider'
    | 'textarea'
  required?: boolean
  options?: string[]
  multiple?: boolean
  maxSelect?: number
  templates?: Array<{ id: string; name: string; preview: string }>
  fields?: Array<{
    label: string
    key: string
    type: 'text' | 'number' | 'switch' | 'radio' | 'date'
    default?: any
    options?: string[]
  }>
}

export interface SkillStepConfig {
  steps: StepConfig[]
  resultCard?: {
    title: string
    template: string
    actions?: Array<{ label: string; action: string }>
  }
}
