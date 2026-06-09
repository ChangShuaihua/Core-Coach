import { View, Text } from '@tarojs/components'
import { ArrowRight } from '@nutui/icons-react-taro'

interface SkillButtonProps {
  onClick: () => void
  selectedSkillName?: string | null
}

const SkillButton = ({ onClick, selectedSkillName }: SkillButtonProps) => {
  const label = selectedSkillName || '技能'
  const isActive = !!selectedSkillName

  return (
    <View
      onClick={onClick}
      className="w-fit flex flex-row items-center px-2 py-1 shadow rounded-lg"
      style={{
        border: `1px solid ${isActive ? '#f97316' : '#d1d5db'}`,
        backgroundColor: isActive ? '#fff7ed' : '#fff',
      }}
    >
      <Text className="text-sm" style={{ color: isActive ? '#f97316' : '#111827' }}>
        {label}
      </Text>
      <Text>
        <ArrowRight size={12} color={isActive ? '#f97316' : undefined} />
      </Text>
    </View>
  )
}

export default SkillButton
