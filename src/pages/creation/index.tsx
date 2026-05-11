import { Image, View } from '@tarojs/components'
import avatar from '@/assets/images/avatar.png'
import Layout from '@/components/Layout'

export default function QAPage() {
  return (
    <Layout title="创作助手">
      <View>创作页面</View>
      <Image src={avatar}></Image>
    </Layout>
  )
}
