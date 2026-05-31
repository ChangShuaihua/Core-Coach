import { View, Text } from '@tarojs/components'
import { Refresh, Photograph, StarFill, ArrowLeft } from '@nutui/icons-react-taro'

export interface ActionConfig {
  key: string
  label: string
  icon?: 'refresh' | 'photo' | 'star' | 'arrow-left'
  color?: string
  bgColor?: string
  onClick: () => void
}

const iconMap = {
  refresh: Refresh,
  photo: Photograph,
  star: StarFill,
  'arrow-left': ArrowLeft,
}

interface ActionBarProps {
  actions: ActionConfig[]
}

export default function ActionBar({ actions }: ActionBarProps) {
  if (actions.length === 0) return null

  return (
    <View className="flex-shrink-0 bg-white py-4 border-t border-gray-200">
      <View className="max-w-2xl mx-auto flex flex-row gap-2">
        {actions.map((action) => {
          const IconComp = action.icon ? iconMap[action.icon] : null
          const color = action.color || '#FF7A2F'
          const bgColor = action.bgColor || '#FFF7F2'

          return (
            <View
              key={action.key}
              className="flex-1 flex flex-row items-center justify-center gap-1 py-2 px-2 rounded-full"
              style={{ backgroundColor: bgColor }}
              onClick={action.onClick}
            >
              {IconComp && <IconComp color={color} size={14} />}
              <Text className="text-sm font-medium" style={{ color }}>
                {action.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
