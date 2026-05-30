import { Text } from '@tarojs/components'
import Card from '@/components/Card'
import ResultPreview from '@/components/ResultPreview'
import ParamSettings from '../ParamSettings'

export interface StepConfig {
  step: number
  title: string
  type: 'param_settings' | 'result_preview'
  required?: boolean
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

export default function StepRenderer({
  config,
  value,
  onChange,
  onSubPageChange,
}: StepRendererProps) {
  const handleDataUpdate = (key: string, val: any) => {
    onChange({ [key]: val })
  }

  switch (config.type) {
    case 'param_settings':
      return <ParamSettings data={value} updateData={handleDataUpdate} currentStep={config} />

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
            支持的类型: param_settings, result_preview
          </Text>
        </Card>
      )
  }
}
