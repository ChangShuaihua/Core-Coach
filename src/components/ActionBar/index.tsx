import { useState, useEffect } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Refresh, Photograph, StarFill, ArrowLeft } from '@nutui/icons-react-taro'
import { generateAndSaveImage } from '@/utils/shareImage'

export interface ShareImageData {
  gameName: string
  gameType: string
  age: number
  content: string
}

export interface ActionConfig {
  key: string
  type?: 'regenerate' | 'share-image' | 'collect' | 'back'
  label?: string
  icon?: 'refresh' | 'photo' | 'star' | 'arrow-left'
  color?: string
  bgColor?: string
  liked?: boolean
  shareData?: ShareImageData
  onClick?: () => void
  onConfirm?: () => void
}

const PRESETS: Record<
  string,
  { label: string; icon: ActionConfig['icon']; color: string; bgColor: string }
> = {
  regenerate: { label: '重新生成', icon: 'refresh', color: '#FF7A2F', bgColor: '#FFF7F2' },
  'share-image': { label: '分享图片', icon: 'photo', color: '#7C5CFC', bgColor: '#F3F0FF' },
  collect: { label: '收藏', icon: 'star', color: '#FFFFFF', bgColor: '#FF7A2F' },
  back: { label: '上一步', icon: 'arrow-left', color: '#4B5563', bgColor: '#F3F4F6' },
}

const iconMap = {
  refresh: Refresh,
  photo: Photograph,
  star: StarFill,
  'arrow-left': ArrowLeft,
}

interface ActionBarProps {
  actions: ActionConfig[]
}

export default function ActionBar({ actions }: ActionBarProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ActionConfig | null>(null)
  const [safeAreaBottom, setSafeAreaBottom] = useState(0)

  useEffect(() => {
    try {
      const systemInfo = Taro.getSystemInfoSync()
      const safeArea = systemInfo.safeArea
      if (safeArea) {
        setSafeAreaBottom(systemInfo.screenHeight - safeArea.bottom)
      }
    } catch {}
  }, [])

  if (actions.length === 0) return null

  const handleCollectClick = (action: ActionConfig) => {
    if (action.liked && action.onConfirm) {
      setConfirmAction(action)
      setShowConfirm(true)
    } else {
      action.onClick?.()
    }
  }

  const handleShareImage = async (action: ActionConfig) => {
    if (!action.shareData) return
    const success = await generateAndSaveImage(action.shareData)
    if (success) {
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } else {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  return (
    <View
      className="flex-shrink-0 bg-white py-3 border-t border-gray-200"
      style={{ paddingBottom: `${12 + safeAreaBottom}px` }}
    >
      <Canvas
        type="2d"
        id="shareCanvas"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '300px',
          height: '420px',
        }}
      />
      <View className="max-w-2xl mx-auto flex flex-row gap-2 px-3">
        {actions.map((action) => {
          const preset = PRESETS[action.type || '']
          const label = action.label || preset?.label || ''
          const icon = action.icon || preset?.icon
          const IconComp = icon ? iconMap[icon] : null

          let color = action.color || preset?.color || '#FF7A2F'
          let bgColor = action.bgColor || preset?.bgColor || '#FFF7F2'

          if (action.type === 'collect' && action.liked) {
            color = '#FF7A2F'
            bgColor = '#FFF7F2'
          }

          const handleClick =
            action.type === 'collect'
              ? () => handleCollectClick(action)
              : action.type === 'share-image'
                ? () => handleShareImage(action)
                : action.onClick

          return (
            <View
              key={action.key}
              className="flex-1 flex flex-row items-center justify-center gap-1 rounded-full"
              style={{
                backgroundColor: bgColor,
                padding: '10px 8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              onClick={handleClick}
            >
              {IconComp && <IconComp color={color} size={15} />}
              <Text className="text-sm font-medium" style={{ color }}>
                {action.liked ? '已收藏' : label}
              </Text>
            </View>
          )
        })}
      </View>

      {showConfirm && confirmAction && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowConfirm(false)}
        >
          <View
            style={{
              width: '80%',
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '24px 16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                display: 'block',
                textAlign: 'center',
                marginBottom: '8px',
              }}
            >
              取消收藏确认
            </Text>
            <Text
              style={{
                fontSize: '14px',
                color: '#6B7280',
                display: 'block',
                textAlign: 'center',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              确定要取消收藏该游戏吗？取消后将无法在收藏列表中找到它。
            </Text>
            <View style={{ display: 'flex', gap: '12px' }}>
              <View
                style={{
                  flex: 1,
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  backgroundColor: '#F3F4F6',
                }}
                onClick={() => setShowConfirm(false)}
              >
                <Text style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                  再想想
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  backgroundColor: '#FF7A2F',
                }}
                onClick={() => {
                  confirmAction.onConfirm?.()
                  setShowConfirm(false)
                }}
              >
                <Text style={{ fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
                  确定取消
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
