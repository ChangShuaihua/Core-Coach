import { useCallback, useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getSkillList } from '@/api/creation'
import { getRecentCreations } from '@/api/more'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useAuthCheck } from '@/hooks'
import { useCreationStore } from '@/store'
import { onGameGenerateStatus, mapWsStatus } from '@/store/taskWsHandler'
import type { Skill } from '@/types/creation'
import type { RecentCreation } from '@/types/creation-list'
import { formatTime } from '@/utils/date'
import { getStatusText, getModeBySkillId } from './constants/skills'

const typeIconMap: Record<string, string> = {
  game: '🎮',
  lesson: '📋',
}

const statusConfig: Record<number, { text: string; color: string; icon: string }> = {
  0: { text: '生成失败', color: 'text-red-500', icon: '😢' },
  1: { text: '', color: '', icon: '' },
  2: { text: '排队中', color: 'text-orange-500', icon: '⏳' },
  3: { text: '生成中', color: 'text-orange-500', icon: '✨' },
}

export default function CreationPage() {
  useAuthCheck()
  const setMode = useCreationStore((state) => state.setMode)
  const skillList = useCreationStore((state) => state.skillList)
  const skillListLoaded = useCreationStore((state) => state.skillListLoaded)
  const setSkillList = useCreationStore((state) => state.setSkillList)
  const [recentList, setRecentList] = useState<RecentCreation[]>([])

  const fetchSkills = async () => {
    console.log('开始获取技能列表...')
    try {
      const data = await getSkillList()
      console.log('获取技能列表成功:', data)
      setSkillList(data)
    } catch (error) {
      console.error('获取技能列表失败:', error)
    }
  }

  const fetchRecent = useCallback(async () => {
    try {
      const data = await getRecentCreations()
      console.log('最近创作数据:', data)
      setRecentList(data)
      return data
    } catch (error) {
      console.error('获取最近创作失败:', error)
      return null
    }
  }, [])

  // 页面每次可见时刷新列表
  useDidShow(() => {
    fetchRecent()
  })

  useEffect(() => {
    if (!skillListLoaded) {
      fetchSkills()
    }
  }, [])

  // 订阅 WS 游戏生成状态，实时更新最近创作列表
  useEffect(() => {
    const unsub = onGameGenerateStatus((data) => {
      const mapped = mapWsStatus(data.status)
      if (mapped === undefined) return

      setRecentList((prev) => {
        const idx = prev.findIndex((item) => item.id === data.record_id)
        if (idx === -1) return prev

        const updated = [...prev]
        updated[idx] = { ...updated[idx], status: mapped }
        // 成功时更新标题
        if (data.result?.game_name) {
          updated[idx] = { ...updated[idx], title: data.result.game_name }
        }
        return updated
      })
    })
    return unsub
  }, [])

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
            {recentList.map((item) => {
              const isProcessing = item.status === 2 || item.status === 3
              const isFailed = item.status === 0
              const config = item.status !== undefined ? statusConfig[item.status] : null

              return (
                <View
                  key={item.id}
                  className={`bg-white rounded-lg p-4 border flex items-center gap-4 ${
                    isProcessing ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    if (isProcessing) {
                      Taro.navigateTo({ url: `/pages/result/index?recordId=${item.id}` })
                    } else {
                      Taro.navigateTo({
                        url: `/pages/detail/index?id=${item.id}&type=${item.type}`,
                      })
                    }
                  }}
                >
                  <View
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isProcessing ? 'bg-orange-200' : isFailed ? 'bg-red-100' : 'bg-orange-100'
                    }`}
                  >
                    <Text className="text-2xl">
                      {isProcessing
                        ? config?.icon || '✨'
                        : isFailed
                          ? '😢'
                          : typeIconMap[item.type] || '✨'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900 block mb-1">
                      {item.title}
                    </Text>
                    <View className="flex items-center gap-2">
                      <Text className="text-xs text-gray-500">{formatTime(item.created_at)}</Text>
                      {isProcessing && (
                        <Text className={`text-xs font-medium ${config?.color}`}>
                          {config?.text}
                        </Text>
                      )}
                      {isFailed && (
                        <Text className="text-xs font-medium text-red-500">生成失败</Text>
                      )}
                    </View>
                  </View>
                  {isProcessing ? (
                    <View className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                  ) : (
                    <Text className="text-gray-400 text-xl">›</Text>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      </View>
    </Layout>
  )
}
