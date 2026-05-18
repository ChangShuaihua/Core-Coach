import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import Layout from '@/components/Layout'

export default function FavoriteLessonsPage() {
  return (
    <Layout
      title="收藏教案"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <View className="flex flex-col items-center justify-center pt-40">
        <Text className="text-lg text-gray-6 mb-4">该功能正在开发中</Text>
        <Text className="text-sm text-gray-5">敬请期待...</Text>
      </View>
    </Layout>
  )
}
