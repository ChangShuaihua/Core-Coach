import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useCreationStore } from '@/store'
import { SKILLS_MOCK_DATA, type Skill } from './constants/skills'

/**
 * 创作工坊入口页面（Tab 页面）
 * 用户选择创作类型：游戏生成、教案生成、视频分析
 */
export default function CreationPage() {
  const setMode = useCreationStore((state) => state.setMode)

  const handleSkillClick = (skill: Skill) => {
    if (skill.status !== 'active') {
      if (skill.action.type === 'toast') {
        Taro.showToast({
          title: skill.action.message || '功能开发中',
          icon: 'none',
        })
      }
      return
    }

    // 处理活跃的技能
    if (skill.action.type === 'navigate' && skill.action.target) {
      // 设置模式到 Store
      if (skill.permissionKey === 'game_gen') {
        setMode('game')
      } else if (skill.permissionKey === 'lesson_plan') {
        setMode('lesson')
      }
      Taro.navigateTo({
        url: skill.action.target,
      })
    }
  }

  // 将技能分组为两个一行
  const skillRows: Skill[][] = []
  for (let i = 0; i < SKILLS_MOCK_DATA.length; i += 2) {
    skillRows.push(SKILLS_MOCK_DATA.slice(i, i + 2))
  }

  return (
    <Layout title="创作工坊">
      <View className="flex flex-col gap-4 p-4">
        {/* 动态渲染技能卡片 - 两个一行 */}
        {skillRows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex gap-4">
            {row.map((skill) => {
              const isActive = skill.status === 'active'

              return (
                <Card
                  key={skill.id}
                  className={`flex-1 p-6 border-2 ${
                    isActive
                      ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100'
                      : 'border-gray-200 bg-gray-100 opacity-60'
                  }`}
                >
                  <View
                    className={`flex flex-col items-center gap-3 text-center ${
                      isActive ? 'active:opacity-70' : ''
                    }`}
                    onClick={() => handleSkillClick(skill)}
                  >
                    {/* Icon */}
                    <View
                      className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-orange-500' : 'bg-gray-400'
                      }`}
                    >
                      <Text className="text-4xl">{skill.icon}</Text>
                    </View>

                    {/* Badge */}
                    {skill.badge && (
                      <View className="absolute top-2 right-2 px-2 py-1 bg-red-500 rounded-full">
                        <Text className="text-xs text-white font-semibold">
                          {skill.badge === 'hot' ? '热门' : '新'}
                        </Text>
                      </View>
                    )}

                    {/* Content */}
                    <View>
                      <Text
                        className={`text-base font-semibold block mb-1 ${
                          isActive ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {skill.name}
                      </Text>
                      <Text
                        className={`text-xs font-medium ${
                          isActive ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {skill.statusText}
                      </Text>
                    </View>
                  </View>
                </Card>
              )
            })}
          </View>
        ))}

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
