import { useCallback, useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { getSkillList } from '@/api/creation'
import { getRecentCreations } from '@/api/more'
import { collectGame, removeFavoriteGame } from '@/api/profile'
import chatLogo from '@/assets/images/chatlogo.png'
import Card from '@/components/Card'
import GameCard from '@/components/GameCard'
import Layout from '@/components/Layout'
import { useLoginStatus } from '@/hooks/useLoginStatus'
import { useCreationStore } from '@/store'
import { onGameGenerateStatus, mapWsStatus } from '@/store/taskWsHandler'
import type { Skill } from '@/types/creation'
import type { RecentCreation } from '@/types/creation-list'
import { formatTime } from '@/utils/date'
import { safeNavigateTo } from '@/utils/route'
import { getStatusText, getModeBySkillId } from './constants/skills'

export default function CreationPage() {
  useShareAppMessage(() => ({
    title: '快来和我一起创作跑酷游戏！脑洞大开超好玩～',
    path: '/pages/creation/index',
    imageUrl: chatLogo,
  }))

  useEffect(() => {
    Taro.showShareMenu({ withShareTicket: true })
  }, [])

  const { isLoggedIn } = useLoginStatus()
  const setMode = useCreationStore((state) => state.setMode)
  const skillList = useCreationStore((state) => state.skillList)
  // const skillListLoaded = useCreationStore((state) => state.skillListLoaded)
  const setSkillList = useCreationStore((state) => state.setSkillList)
  const [recentList, setRecentList] = useState<RecentCreation[]>([])

  const fetchSkills = useCallback(async () => {
    try {
      const data = await getSkillList()
      setSkillList(data)
    } catch (error) {
      console.error('获取技能列表失败:', error)
    }
  }, [setSkillList])

  const fetchRecent = useCallback(async () => {
    if (!isLoggedIn) return null
    try {
      const data = await getRecentCreations()
      setRecentList(data)
      return data
    } catch (error) {
      console.error('获取最近创作失败:', error)
      return null
    }
  }, [isLoggedIn])

  // 页面每次可见时刷新创作列表和技能列表
  useDidShow(() => {
    fetchRecent()
    fetchSkills()
  })

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

  const handleToggleFavorite = useCallback(
    async (item: RecentCreation) => {
      if (!isLoggedIn) {
        safeNavigateTo({ url: '/pages/login/index' })
        return
      }
      try {
        if (item.is_like === 1) {
          // 已收藏 → 取消收藏，必须使用 favorite_id
          if (!item.favorite_id) {
            Taro.showToast({ title: '请刷新列表后再取消收藏', icon: 'none' })
            return
          }
          await removeFavoriteGame(item.favorite_id)
          Taro.showToast({ title: '已取消收藏', icon: 'success' })
        } else {
          // 未收藏 → 添加收藏
          await collectGame(item.id)
          Taro.showToast({ title: '已收藏', icon: 'success' })
        }
        // 操作成功后重新获取最新列表数据
        fetchRecent()
      } catch (err: any) {
        Taro.showToast({ title: err?.message || '操作失败', icon: 'none' })
      }
    },
    [isLoggedIn, fetchRecent]
  )

  const handleSkillClick = (skill: Skill) => {
    if (!isLoggedIn) {
      safeNavigateTo({ url: '/pages/login/index' })
      return
    }
    if (skill.status !== 1) {
      Taro.showToast({
        title: getStatusText(skill.status),
        icon: 'none',
      })
      return
    }

    const mode = getModeBySkillId(skill.id)
    setMode(mode)
    safeNavigateTo({
      url: `/pages/wizard/index?mode=${mode}`,
    })
  }

  const renderIcon = (skill: Skill) => {
    if (skill.image_need === 1 && skill.icon.startsWith('http')) {
      return <Image className="w-16 h-16" src={skill.icon} mode="aspectFit" />
    }
    if (skill.icon.length > 2) {
      return <Image className="w-16 h-16" src={skill.icon} mode="aspectFit" />
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
              const isLastAlone = rowIndex === skillRows.length - 1 && row.length === 1

              return (
                <Card
                  key={skill.id}
                  className={`${isLastAlone ? 'flex-2' : 'flex-1'} p-6 border-2 ${
                    isActive
                      ? 'border-orange-600 bg-white'
                      : 'border-gray-200 bg-gray-100 opacity-60'
                  }`}
                  style={isLastAlone ? { width: '35%' } : undefined}
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
              onClick={() => {
                if (!isLoggedIn) {
                  safeNavigateTo({ url: '/pages/login/index' })
                  return
                }
                safeNavigateTo({ url: '/pages/more/index' })
              }}
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
              <GameCard
                key={item.id}
                title={item.title}
                age={item.age}
                gameType={item.game_type}
                extra={formatTime(item.created_at)}
                status={item.status}
                className="mb-3"
                onClick={() => {
                  if (item.status === 2 || item.status === 3) {
                    safeNavigateTo({ url: `/pages/result/index?recordId=${item.id}` })
                  } else {
                    safeNavigateTo({
                      url: `/pages/detail/index?id=${item.id}&type=${item.type}`,
                    })
                  }
                }}
                favorited={item.is_like === 1}
                onToggleFavorite={() => handleToggleFavorite(item)}
                rightSlot={<Text className="text-gray-400 text-xl">›</Text>}
              />
            ))}
          </View>
        </View>
      </View>
    </Layout>
  )
}
