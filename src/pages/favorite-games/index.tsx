import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import Layout from '@/components/Layout'

export default function AboutPage() {
  return (
    <Layout
      title="收藏游戏"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <Text>收藏游戏</Text>
    </Layout>
  )
}
