import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Layout from '@/components/Layout'
import { useCreationStore } from '@/store'

/**
 * 创作工坊入口页面（Tab 页面）
 * 用户选择创作类型：游戏生成、教案生成、视频分析
 */
export default function CreationPage() {
  const setMode = useCreationStore((state) => state.setMode)

  const handleModeSelect = (mode: 'game' | 'lesson' | 'video') => {
    // 存储选择的模式到 Store
    setMode(mode)
    // 跳转到创作向导页面
    Taro.navigateTo({
      url: '/pages/wizard/index',
    })
  }

  return (
    <Layout title="创作工坊">
      <View className="flex flex-col gap-4 p-4">
        {/* 游戏生成 - 已开放 */}
        <View
          className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300 active:opacity-70"
          onClick={() => handleModeSelect('game')}
        >
          <View className="flex items-center gap-4">
            <View className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
              <Text className="text-4xl">🎮</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900 block mb-1">游戏生成</Text>
              <Text className="text-sm text-green-600 font-medium">已开放</Text>
            </View>
            <Text className="text-gray-400 text-2xl">›</Text>
          </View>
        </View>

        {/* 教案生成 - 即将开放 */}
        <View className="bg-gray-100 rounded-lg p-6 border-2 border-gray-200 opacity-60">
          <View className="flex items-center gap-4">
            <View className="w-16 h-16 bg-gray-400 rounded-lg flex items-center justify-center">
              <Text className="text-4xl">📋</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-700 block mb-1">教案生成</Text>
              <Text className="text-sm text-gray-500">即将开放</Text>
            </View>
          </View>
        </View>

        {/* 视频分析 - 即将开放 */}
        <View className="bg-gray-100 rounded-lg p-6 border-2 border-gray-200 opacity-60">
          <View className="flex items-center gap-4">
            <View className="w-16 h-16 bg-gray-400 rounded-lg flex items-center justify-center">
              <Text className="text-4xl">🎬</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-700 block mb-1">视频分析</Text>
              <Text className="text-sm text-gray-500">即将开放</Text>
            </View>
          </View>
        </View>

        {/* 最近创作 */}
        <View className="mt-6">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">最近创作</Text>
            <Text className="text-sm text-orange-600">全部 ›</Text>
          </View>

          {/* 最近创作列表 */}
          <View className="flex flex-col gap-3">
            {/* 示例项 1 */}
            <View className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 active:bg-gray-50">
              <View className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Text className="text-2xl">🎮</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 block mb-1">
                  春红自然探索游戏
                </Text>
                <Text className="text-xs text-gray-500">2分钟前</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>

            {/* 示例项 2 */}
            <View className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 active:bg-gray-50">
              <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Text className="text-2xl">🏃</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 block mb-1">
                  海洋探险跑酷教案
                </Text>
                <Text className="text-xs text-gray-500">昨天</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>

            {/* 示例项 3 */}
            <View className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 active:bg-gray-50">
              <View className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Text className="text-2xl">🏰</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 block mb-1">
                  城堡勇士闯关游戏
                </Text>
                <Text className="text-xs text-gray-500">2天前</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </View>
        </View>
      </View>
    </Layout>
  )
}
