import { Text } from '@tarojs/components'
import Card from '@/components/Card'
import ParamSettings from '../ParamSettings'
import ResultPreview from '../ResultPreview'
import Selector from '../Selector'
import TemplateGrid from '../TemplateSelector'
import UploadComponent from '../UploadComponent'

export interface SelectorOption {
  label: string
  value: string
  icon?: string
}

export interface StepConfig {
  step: number
  title: string
  type: 'selector' | 'template_grid' | 'param_settings' | 'upload' | 'result_preview'
  required?: boolean
  // selector 配置
  options?: string[] | SelectorOption[]
  multiple?: boolean
  maxSelect?: number
  // template_grid 配置
  templates?: Array<{
    id: string
    name: string
    preview?: string
    emoji?: string
    description?: string
    isNew?: boolean
  }>
  // upload 配置
  accept?: string
  maxSize?: number
  // result_preview 配置
  previewTemplate?: string
  actions?: Array<{
    label: string
    action: string
    api?: string
  }>
}

interface StepRendererProps {
  config: StepConfig
  value: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

/**
 * StepRenderer - 步骤渲染器
 *
 * 根据 config.type 动态渲染对应的组件
 *
 * 支持的组件类型：
 * - selector: 道具/动作选择器（支持单选/多选）
 * - template_grid: 模板网格选择
 * - param_settings: 参数设置表单
 * - upload: 文件上传
 * - result_preview: 结果预览
 */
export default function StepRenderer({ config, value, onChange }: StepRendererProps) {
  const handleChange = (key: string, val: any) => {
    onChange({ [key]: val })
  }

  const handleDataUpdate = (key: string, val: any) => {
    onChange({ [key]: val })
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

    case 'param_settings':
      return <ParamSettings data={value} updateData={handleDataUpdate} currentStep={config} />

    case 'upload':
      return (
        <UploadComponent
          config={config as any}
          value={value}
          onChange={(val) => handleChange(`step_${config.step}`, val)}
        />
      )

    case 'result_preview':
      return <ResultPreview config={config as any} value={value} onChange={onChange} />

    default:
      return (
        <Card className="p-6">
          <Text className="text-red-500">未知组件类型: {config.type}</Text>
          <Text className="text-sm text-gray-600 mt-2">
            支持的类型: selector, template_grid, param_settings, upload, result_preview
          </Text>
        </Card>
      )
  }
}
