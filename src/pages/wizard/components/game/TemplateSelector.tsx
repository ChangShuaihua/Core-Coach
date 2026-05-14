import { View, Text } from '@tarojs/components'
import classNames from 'classnames'
import { GAME_TEMPLATES } from '../../constants/gameTemplates'

export interface TemplateSelectorProps {
  data: Record<string, any>
  updateData: (key: string, value: any) => void
  currentStep: any
}

export default function TemplateSelector({ data, updateData }: TemplateSelectorProps) {
  const selectedTemplate = data.selectedTemplate

  const handleTemplateSelect = (templateId: string) => {
    updateData('selectedTemplate', templateId)
  }

  return (
    <View className="w-full bg-white rounded-lg p-4">
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">选择游戏模板</Text>
        <Text className="text-sm text-gray-600">选择一个游戏模板开始创作</Text>
      </View>

      <View className="grid grid-cols-2 gap-4">
        {GAME_TEMPLATES.map((template) => {
          const isSelected = selectedTemplate === template.id

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
              onClick={() => handleTemplateSelect(template.id)}
            >
              {/* Template Image/Emoji */}
              <View className="relative w-full h-40 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <Text className="text-6xl">{template.emoji || '🎮'}</Text>

                {template.isNew && (
                  <View className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold">新品</Text>
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
                <Text
                  className={classNames('text-xs leading-relaxed', {
                    'text-orange-500': isSelected,
                    'text-gray-600': !isSelected,
                  })}
                >
                  {template.description}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
