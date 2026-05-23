import { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getSkillList } from '@/api/creation'
import { getRecentCreations } from '@/api/creation-list'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useCreationStore } from '@/store'
import type { RecentCreation } from '@/types/creation-list'
import { getStatusText, getModeBySkillId, SKILLS_MOCK_DATA } from './constants/skills'
import type { Skill } from './constants/skills'

const typeIconMap: Record<string, string> = {
  game: '🎮',
  lesson: '📋',
}

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return '昨天'
  if (diffDay < 30) return `${diffDay}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export default function CreationPage() {
  const setMode = useCreationStore((state) => state.setMode)
  const skillList = useCreationStore((state) => state.skillList)
  const skillListLoaded = useCreationStore((state) => state.skillListLoaded)
  const setSkillList = useCreationStore((state) => state.setSkillList)
  const [recentList, setRecentList] = useState<RecentCreation[]>([])

  useEffect(() => {
    if (!skillListLoaded) {
      fetchSkills()
    }
    fetchRecent()
  }, [])

  const fetchSkills = async () => {
    try {
      const data = await getSkillList()
      setSkillList(data)
    } catch (error) {
      console.error('获取技能列表失败:', error)
      setSkillList(SKILLS_MOCK_DATA)
    }
  }

  const fetchRecent = async () => {
    try {
      const data = await getRecentCreations()
      setRecentList(data)
    } catch (error) {
      console.error('获取最近创作失败:', error)
    }
  }

  const handleSkillClick = (skill: Skill) => {
    if (skill.status !== 1) {
      Taro.showToast({
        title: getStatusText(skill.status),
        icon: 'none',
      })
      return
    }

    const mode = getModeBySkillId(skill.id)
    setMode(mode)
    Taro.navigateTo({
      url: `/pages/wizard/index?mode=${mode}`,
    })
  }

  const renderIcon = (skill: Skill) => {
    if (skill.image_need === 1 && skill.icon.startsWith('http')) {
      return <Image className="w-10 h-10" src={skill.icon} mode="aspectFit" />
    }
    return <Text className="text-4xl">{skill.icon}</Text>
  }

  const skillRows: Skill[][] = []
  for (let i = 0; i < skillList.length; i += 2) {
    skillRows.push(skillList.slice(i, i + 2))
  }

  return (
    <Layout title="创作工坊">
      <View className="flex flex-col gap-4 p-4">
        {skillRows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex gap-4">
            {row.map((skill) => {
              const isActive = skill.status === 1

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
                    className="flex flex-col items-center gap-3 text-center"
                    onClick={() => handleSkillClick(skill)}
                  >
                    <View
                      className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-orange-500' : 'bg-gray-400'
                      }`}
                    >
                      {renderIcon(skill)}
                    </View>

                    <View>
                      <Text
                        className={`text-base font-semibold block mb-1 ${
                          isActive ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {skill.description}
                      </Text>
                      <Text
                        className={`text-xs font-medium ${
                          isActive ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {getStatusText(skill.status)}
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
            <Text
              className="text-sm text-orange-600"
              onClick={() => Taro.navigateTo({ url: '/pages/more/index' })}
            >
              全部 ›
            </Text>
          </View>

          <View className="flex flex-col gap-3">
            {recentList.length === 0 && (
              <View className="py-8 text-center">
                <Text className="text-sm text-gray-400">暂无创作记录</Text>
              </View>
            )}
            {recentList.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4"
                onClick={() =>
                  Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}&type=${item.type}` })
                }
              >
                <View className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Text className="text-2xl">{typeIconMap[item.type] || '✨'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 block mb-1">
                    {item.title}
                  </Text>
                  <Text className="text-xs text-gray-500">{formatTime(item.created_at)}</Text>
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Layout>
  )
}
