import { View, Text } from '@tarojs/components'
import { Image } from '@nutui/nutui-react-taro'
import CHATLOGO from '@/assets/images/chatlogo.png'

const WelcomeScreen = () => {
  return (
    <View className="h-full flex flex-col items-center justify-center px-8 bg-white">
      <Image src={CHATLOGO} width={200} height={200} />
      <Text className="text-lg font-bold text-gray-900 text-center">
        你好，欢迎使用核心力量问答助手
      </Text>
      <Text className="text-xs text-gray-600 mt-3 text-center leading-relaxed">
        你可以直接询问我，或选择下方技能
      </Text>
    </View>
  )
}

export default WelcomeScreen
