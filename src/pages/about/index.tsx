import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, Tips, Star } from '@nutui/icons-react-taro'
import Card from '@/components/Card'
import Layout from '@/components/Layout'

export default function AboutPage() {
  return (
    <Layout
      title="关于"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <View className="p-4">
        <Card className="mb-4">
          <View className="px-4 py-4">
            <View className="flex flex-row items-center mb-3">
              <View className="mr-2 flex">
                <Tips color="#fe6601" size={18} />
              </View>
              <Text className="text-sm font-medium text-gray-8">关于我们</Text>
            </View>
            <Text className="text-sm text-gray-6" style={{ lineHeight: '24px' }}>
              自创业起，团队只做了一件事：跑酷。
              两年从一无所有到成为全国跑酷第一品牌，我们拥有独立开发的课程体系并自行营运新媒体，目前全网信息量第一。
              8年跑酷推广及开发经验，全国50余家课程加盟单位。课程合作单位600余家，2019年获得山东体育局授权独家推广单位，全国累积培训学员3000余名。
              2020年底重新打磨整体VI体系并开设核心力量少儿跑酷运动馆2.0版店面，公司平均年龄24岁，我们还年轻，但我们要做体育培训行业最酷的公司。
            </Text>
          </View>
        </Card>

        <Card className="mb-4">
          <View className="px-4 py-4">
            <View className="flex flex-row items-center mb-3">
              <View className="mr-2 flex">
                <Star color="#fe6601" size={18} />
              </View>
              <Text className="text-sm font-medium text-gray-8">核心力量介绍</Text>
            </View>
            <Text className="text-sm text-gray-6" style={{ lineHeight: '24px' }}>
              核心力量专注于为3-12岁青少年提供合适身心发展的跑酷训练，
              以科学的育儿服务及优质运动行为打造为辅的运动课程，打造家门口的跑酷运动馆，
              利用“专业化课程”“高展示性宣传”“系统开店模型”“成熟门店数据管理”来链接和赋能教练及运动馆，
              为中国儿童提供最实用的运动课程。
            </Text>
          </View>
        </Card>

        <Card>
          <View className="px-4 py-4">
            <View className="flex flex-col items-center">
              <Text className="text-xs text-gray-400">核心力量 · 问答助手 | v1.0.0</Text>
            </View>
          </View>
        </Card>
      </View>
    </Layout>
  )
}
