import { View, Text, Textarea } from '@tarojs/components'
import Card from '@/components/Card'

export interface TextareaConfig {
  step: number
  title: string
  placeholder?: string
  minHeight?: number
  required?: boolean
}

interface TextareaComponentProps {
  config: TextareaConfig
  value: any
  onChange: (value: string) => void
}

/**
 * TextareaComponent - 多行文本组件
 *
 * 用于处理 type: 'textarea' 的步骤
 */
export default function TextareaComponent({ config, value, onChange }: TextareaComponentProps) {
  const fieldKey = `step_${config.step}`
  const currentValue = value[fieldKey] || ''

  return (
    <Card className="p-6">
      <Text className="text-lg font-semibold mb-4 block">{config.title}</Text>
      <Textarea
        placeholder={config.placeholder || `请输入${config.title}`}
        value={currentValue}
        onInput={(e) => onChange(e.detail.value)}
        className="border border-gray-300 rounded px-3 py-2 w-full"
        style={{ minHeight: `${config.minHeight || 120}px` }}
      />
    </Card>
  )
}
