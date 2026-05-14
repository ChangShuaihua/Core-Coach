import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, Clock, User, Star } from '@nutui/icons-react-taro'
import Layout from '@/components/Layout'
import type { Game } from '@/data/mock/games'
import { mockGamesDetail } from '@/data/mock/games'

interface GameDetailProps {
  game: Game
}

export default function GameDetail({ game }: GameDetailProps) {
  const detailGame = mockGamesDetail[game.id] || game

  return (
    <Layout
      title="游戏详情"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <View className="p-4 bg-gray-1 min-h-screen">
        <View className="bg-white rounded-xl p-6 mb-4">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-10">{detailGame.name}</Text>
            <View className="px-3 py-1 bg-orange-1 rounded-full">
              <Text className="text-sm text-orange-6">{detailGame.category}</Text>
            </View>
          </View>

          <View className="flex gap-6 mb-4">
            <View className="flex items-center gap-2">
              <Clock size={16} className="text-gray-5" />
              <Text className="text-sm text-gray-6">{detailGame.duration}</Text>
            </View>
            <View className="flex items-center gap-2">
              <User size={16} className="text-gray-5" />
              <Text className="text-sm text-gray-6">{detailGame.players}人</Text>
            </View>
          </View>

          <Text className="text-base text-gray-7 leading-relaxed">{detailGame.description}</Text>
        </View>

        <View className="bg-white rounded-xl p-6">
          <Text className="text-base font-semibold text-gray-10 mb-4">游戏玩法</Text>
          <View>
            <View className="flex items-start gap-3 mb-3">
              <View className="w-6 h-6 bg-orange-1 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Text className="text-xs text-orange-6 font-medium">1</Text>
              </View>
              <Text className="text-sm text-gray-7">准备阶段：确定游戏规则和目标</Text>
            </View>
            <View className="flex items-start gap-3 mb-3">
              <View className="w-6 h-6 bg-orange-1 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Text className="text-xs text-orange-6 font-medium">2</Text>
              </View>
              <Text className="text-sm text-gray-7">进行阶段：按照规则开始游戏</Text>
            </View>
            <View className="flex items-start gap-3">
              <View className="w-6 h-6 bg-orange-1 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Text className="text-xs text-orange-6 font-medium">3</Text>
              </View>
              <Text className="text-sm text-gray-7">结束阶段：总结游戏，分享感受</Text>
            </View>
          </View>
        </View>

        <View className="mt-6">
          <View className="flex items-center justify-center gap-2">
            <Star color="#ffb800" size={24} />
            <Text className="text-sm text-gray-6">收藏该游戏</Text>
          </View>
        </View>
      </View>
    </Layout>
  )
}
