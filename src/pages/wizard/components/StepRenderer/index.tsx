import { Text } from '@tarojs/components'
import Card from '@/components/Card'
import FormComponent from '../FormComponent'
import RadioGroupComponent from '../RadioGroupComponent'
import Selector from '../Selector'
import SliderComponent from '../SliderComponent'
import TemplateGrid from '../TemplateGridComponent'
import TextareaComponent from '../TextareaComponent'

export interface SelectorOption {
  label: string
  value: string
  icon?: string
}

export interface StepConfig {
  step: number
  title: string
  type: 'selector' | 'template_grid' | 'form' | 'radio_group' | 'slider' | 'textarea'
  required?: boolean
  options?: string[] | SelectorOption[]
  multiple?: boolean
  maxSelect?: number
  templates?: Array<{ id: string; name: string; preview: string }>
  fields?: Array<{
    label: string
    key: string
    type: 'text' | 'number' | 'switch' | 'radio'
    default?: any
    options?: string[]
    required?: boolean
    placeholder?: string
    min?: number
    max?: number
  }>
  min?: number
  max?: number
  placeholder?: string
  minHeight?: number
}

interface StepRendererProps {
  config: StepConfig
  value: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

/**
 * StepRenderer - 页面私有的步骤渲染器
 *
 * 职责：根据 config.type 路由到对应的具体组件
 *
 * 支持的类型：
 * - selector: 单选/多选（支持字符串数组或对象数组格式）
 * - template_grid: 模板网格
 * - form: 动态表单
 * - radio_group: 单选按钮组
 * - slider: 滑动条
 * - textarea: 多行文本
 */
export default function StepRenderer({ config, value, onChange }: StepRendererProps) {
  const handleChange = (key: string, val: any) => {
    onChange({ [key]: val })
  }

  const handleFormChange = (data: Record<string, any>) => {
    onChange(data)
  }

  switch (config.type) {
    case 'selector':
      return (
        <Selector
          config={config as any}
          value={value}
          onChange={(val) => handleChange(`step_${config.step}`, val)}
        />
      )

    case 'template_grid':
      return (
        <TemplateGrid
          config={config as any}
          value={value}
          onChange={(val) => handleChange(`step_${config.step}`, val)}
        />
      )

    case 'form':
      return <FormComponent config={config as any} value={value} onChange={handleFormChange} />

    case 'radio_group':
      return (
        <RadioGroupComponent
          config={config as any}
          value={value}
          onChange={(val) => handleChange(`step_${config.step}`, val)}
        />
      )

    case 'slider':
      return (
        <SliderComponent
          config={config as any}
          value={value}
          onChange={(val) => handleChange(`step_${config.step}`, val)}
        />
      )

    case 'textarea':
      return (
        <TextareaComponent
          config={config as any}
          value={value}
          onChange={(val) => handleChange(`step_${config.step}`, val)}
        />
      )

    default:
      return (
        <Card className="p-6">
          <Text className="text-red-500">未知组件类型: {config.type}</Text>
        </Card>
      )
  }
}
