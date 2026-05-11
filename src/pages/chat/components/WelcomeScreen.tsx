import { View, Text } from '@tarojs/components'
import { Image } from '@nutui/nutui-react-taro'
import CHATLOGO from '@/assets/images/chatlogo.png'

const WelcomeScreen = () => {
  return (
    // flex-1 占据剩余空间，justify-center 和 items-center 让内容水平垂直居中
    <View className="flex-1 flex flex-col items-center justify-center px-8 bg-white">
      {/* 简单的装饰图标或 Logo，这里用文字代替 */}
      <View className="flex items-center justify-center mb-1">
        <Image src={CHATLOGO} width={200} height={200} />
      </View>

      {/* 主标题 */}
      <Text className="text-xl font-bold text-gray-900 text-center">有什么我能帮你的吗？</Text>

      {/* 副标题 */}
      <Text className="text-xs text-gray-600 mt-3 text-center leading-relaxed">
        你可以直接询问我，或选择下方技能
      </Text>
    </View>
  )
}

export default WelcomeScreen
