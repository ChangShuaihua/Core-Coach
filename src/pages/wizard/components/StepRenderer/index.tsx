import { Text } from '@tarojs/components'
import Card from '@/components/Card'
import ParamSettings from '../ParamSettings'
import ResultPreview from '../ResultPreview'
import Selector from '../Selector'
import UploadComponent from '../UploadComponent'

export interface SelectorOption {
  label: string
  value: string
  icon?: string
}

export interface StepConfig {
  step: number
  title: string
  type: 'selector' | 'param_settings' | 'upload' | 'result_preview'
  required?: boolean
  // selector 配置
  options?: string[] | SelectorOption[]
  multiple?: boolean
  maxSelect?: number
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
  onSubPageChange?: (active: boolean) => void
}

/**
 * StepRenderer - 步骤渲染器
 *
 * 根据 config.type 动态渲染对应的组件
 *
 */
export default function StepRenderer({
  config,
  value,
  onChange,
  onSubPageChange,
}: StepRendererProps) {
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
      return (
        <ResultPreview
          config={config as any}
          value={value}
          onChange={onChange}
          onSubPageChange={onSubPageChange}
        />
      )

    default:
      return (
        <Card>
          <Text className="text-red-500">未知组件类型: {config.type}</Text>
          <Text className="text-sm text-gray-600 mt-2">
            支持的类型: selector, param_settings, upload, result_preview
          </Text>
        </Card>
      )
  }
}
