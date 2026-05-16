import { View, Text, Input, Switch, RadioGroup, Radio } from '@tarojs/components'
import Card from '@/components/Card'

export interface FormField {
  label: string
  key: string
  type: 'text' | 'number' | 'switch' | 'radio'
  default?: any
  options?: string[]
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
}

export interface FormConfig {
  step: number
  title: string
  fields: FormField[]
  required?: boolean
}

interface FormComponentProps {
  config: FormConfig
  value: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

/**
 * FormComponent - 动态表单组件
 *
 * 用于处理 type: 'form' 的步骤
 * 支持多种字段类型：text, number, switch, radio
 */
export default function FormComponent({ config, value, onChange }: FormComponentProps) {
  const handleFieldChange = (key: string, val: any) => {
    onChange({ [key]: val })
  }

  return (
    <Card className="p-6">
      <Text className="text-lg font-semibold mb-4 block">{config.title}</Text>
      <View className="flex flex-col gap-4">
        {config.fields.map((field) => (
          <View key={field.key} className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <Text className="text-red-500"> *</Text>}
            </Text>

            {/* 文本输入 */}
            {field.type === 'text' && (
              <Input
                type="text"
                placeholder={field.placeholder || `请输入${field.label}`}
                value={value[field.key] || ''}
                onInput={(e) => handleFieldChange(field.key, e.detail.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            )}

            {/* 数字输入 */}
            {field.type === 'number' && (
              <View className="flex flex-col gap-1">
                <Input
                  type="number"
                  placeholder={field.placeholder || `请输入${field.label}`}
                  value={
                    value[field.key] !== undefined
                      ? String(value[field.key])
                      : String(field.default || '')
                  }
                  onInput={(e) => {
                    const numValue = Number(e.detail.value)
                    handleFieldChange(field.key, numValue)
                  }}
                  className="border border-gray-300 rounded px-3 py-2"
                />
                {(field.min !== undefined || field.max !== undefined) && (
                  <Text className="text-xs text-gray-500">
                    {field.min !== undefined && field.max !== undefined
                      ? `范围: ${field.min} - ${field.max}`
                      : field.min !== undefined
                        ? `最小值: ${field.min}`
                        : `最大值: ${field.max}`}
                  </Text>
                )}
              </View>
            )}

            {/* 开关 */}
            {field.type === 'switch' && (
              <View className="flex items-center gap-3">
                <Switch
                  checked={value[field.key] ?? field.default ?? false}
                  onChange={(e) => handleFieldChange(field.key, e.detail.value)}
                />
                <Text className="text-sm text-gray-600">
                  {value[field.key] ? '已启用' : '已禁用'}
                </Text>
              </View>
            )}

            {/* 单选按钮 */}
            {field.type === 'radio' && field.options && (
              <RadioGroup onChange={(e) => handleFieldChange(field.key, e.detail.value)}>
                <View className="flex flex-col gap-2">
                  {field.options.map((opt) => (
                    <View key={opt} className="flex items-center">
                      <Radio value={opt} checked={value[field.key] === opt} />
                      <Text className="ml-2">{opt}</Text>
                    </View>
                  ))}
                </View>
              </RadioGroup>
            )}
          </View>
        ))}
      </View>
    </Card>
  )
}
