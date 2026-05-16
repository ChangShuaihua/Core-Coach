import { View, Text, Image } from '@tarojs/components'
import classNames from 'classnames'
import Card from '@/components/Card'

export interface Template {
  id: string
  name: string
  preview?: string
  emoji?: string
  description?: string
  isNew?: boolean
}

export interface TemplateGridConfig {
  step: number
  title: string
  templates: Template[]
  required?: boolean
}

interface TemplateGridProps {
  config: TemplateGridConfig
  value: any
  onChange: (value: string) => void
}

/**
 * TemplateGrid - 模板网格选择组件
 *
 * 用于处理 type: 'template_grid' 的步骤
 * 采用美观的卡片布局，支持图片预览、emoji、描述等
 */
export default function TemplateGrid({ config, value, onChange }: TemplateGridProps) {
  const fieldKey = `step_${config.step}`
  const selectedId = value[fieldKey]

  return (
    <Card className="p-6">
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">{config.title}</Text>
        <Text className="text-sm text-gray-600">选择一个模板开始创作</Text>
      </View>

      <View className="grid grid-cols-2 gap-4">
        {config.templates.map((template) => {
          const isSelected = selectedId === template.id

          return (
            <View
              key={template.id}
              className={classNames(
                'relative rounded-2xl overflow-hidden cursor-pointer transition-all',
                {
                  'ring-4 ring-orange-500 scale-105': isSelected,
                  'shadow-md': !isSelected,
                }
              )}
              onClick={() => onChange(template.id)}
            >
              {/* Template Image/Emoji */}
              <View className="relative w-full h-40 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                {template.emoji ? (
                  <Text className="text-6xl">{template.emoji}</Text>
                ) : template.preview ? (
                  <Image
                    src={template.preview}
                    className="w-full h-full object-cover"
                    mode="aspectFill"
                  />
                ) : (
                  <Text className="text-6xl">🎮</Text>
                )}

                {template.isNew && (
                  <View className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-white">新品</Text>
                  </View>
                )}

                {isSelected && (
                  <View className="absolute bottom-3 right-3 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Text className="text-white text-lg font-bold">✓</Text>
                  </View>
                )}
              </View>

              {/* Template Info */}
              <View
                className={classNames('p-4', {
                  'bg-orange-50': isSelected,
                  'bg-white': !isSelected,
                })}
              >
                <Text
                  className={classNames('text-sm font-semibold mb-2', {
                    'text-orange-600': isSelected,
                    'text-gray-900': !isSelected,
                  })}
                >
                  {template.name}
                </Text>
                {template.description && (
                  <Text
                    className={classNames('text-xs leading-relaxed', {
                      'text-orange-500': isSelected,
                      'text-gray-600': !isSelected,
                    })}
                  >
                    {template.description}
                  </Text>
                )}
              </View>
            </View>
          )
        })}
      </View>
    </Card>
  )
}
