import { View, Text } from '@tarojs/components'
import { ArrowRight } from '@nutui/icons-react-taro'

interface SkillButtonProps {
  onClick: () => void
}

const SkillButton = ({ onClick }: SkillButtonProps) => {
  return (
    <View
      onClick={onClick}
      className="ml-6 w-10 flex flex-row items-center px-2 py-1 shadow rounded-lg"
      style={{ border: '1px solid #d1d5db' }}
    >
      <Text className="text-sm text-gray-900">技能</Text>
      <Text>
        <ArrowRight size={12} />
      </Text>
    </View>
  )
}

export default SkillButton
