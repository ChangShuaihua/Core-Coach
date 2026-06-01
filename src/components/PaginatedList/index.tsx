import { useState, useCallback, useEffect, useRef } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { ScrollViewProps } from '@tarojs/components'
import { Top } from '@nutui/icons-react-taro'

export interface PaginatedListProps<T> {
  items: T[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  renderItem: (item: T, index: number) => React.ReactNode
  renderHeader?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  emptyText?: string
  showBackTop?: boolean
  loadingMore?: boolean
  triggerIndex?: number
}

export default function PaginatedList<T>({
  items,
  loading,
  hasMore,
  onLoadMore,
  renderItem,
  renderHeader,
  renderEmpty,
  emptyText = '暂无数据',
  showBackTop = true,
  loadingMore = false,
  triggerIndex = 6,
}: PaginatedListProps<T>) {
  const [showBackTopBtn, setShowBackTopBtn] = useState(false)
  const [scrollTop, setScrollTop] = useState<number | undefined>(undefined)
  const observerRef = useRef<Taro.IntersectionObserver | null>(null)
  const isTriggering = useRef(false)

  const handleScroll: ScrollViewProps['onScroll'] = useCallback((e) => {
    setShowBackTopBtn(e.detail.scrollTop > 300)
  }, [])

  const scrollToTop = useCallback(() => {
    setScrollTop(0)
    setTimeout(() => setScrollTop(undefined), 100)
  }, [])

  useEffect(() => {
    if (!hasMore || loading || loadingMore || items.length === 0) {
      if (observerRef.current) observerRef.current.disconnect()
      return
    }

    const targetIndex = items.length > triggerIndex ? triggerIndex : items.length - 1

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const page = Taro.getCurrentInstance().page
    if (!page) return
    const observer = Taro.createIntersectionObserver(page as any)
    observerRef.current = observer

    observer.relativeToViewport({ bottom: 0 }).observe(`.lazy-trigger-${targetIndex}`, (res) => {
      if ((res.intersectionRatio ?? 0) > 0 && !isTriggering.current) {
        isTriggering.current = true
        onLoadMore()
        setTimeout(() => {
          isTriggering.current = false
        }, 500)
      }
    })

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [items, hasMore, loading, loadingMore, triggerIndex, onLoadMore])

  const defaultEmpty = () => (
    <View className="flex flex-col items-center justify-center pt-24">
      <Text style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📭</Text>
      <Text className="text-base text-gray-5">{emptyText}</Text>
    </View>
  )

  return (
    <View className="relative" style={{ height: '100%', width: '100%' }}>
      <ScrollView
        scrollY
        style={{ height: '100%' }}
        onScroll={handleScroll}
        scrollTop={scrollTop}
        scrollWithAnimation
        enhanced
        showScrollbar={false}
      >
        {renderHeader?.()}

        {loading && items.length === 0 ? (
          <View className="flex flex-col items-center justify-center pt-24">
            <View className="w-10 h-10 border-4 border-orange-6 border-t-orange-2 rounded-full animate-spin" />
            <Text className="text-sm text-gray-5 mt-4">加载中...</Text>
          </View>
        ) : items.length === 0 ? (
          renderEmpty?.() || defaultEmpty()
        ) : (
          <View className="p-4">
            {items.map((item, index) => (
              <View key={index} className={`lazy-trigger-${index}`} style={{ width: '100%' }}>
                {renderItem(item, index)}
              </View>
            ))}

            {loadingMore && (
              <View className="flex items-center justify-center py-4">
                <View className="w-6 h-6 border-2 border-orange-6 border-t-orange-2 rounded-full animate-spin" />
                <Text className="text-sm text-orange-6 ml-2">正在载入更多...</Text>
              </View>
            )}

            {!hasMore && items.length > 0 && (
              <View className="flex items-center justify-center py-4">
                <View className="flex-1 h-px bg-gray-3" />
                <Text className="text-xs text-gray-5 px-4">没有更多了（共 {items.length} 条）</Text>
                <View className="flex-1 h-px bg-gray-3" />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {showBackTop && showBackTopBtn && (
        <View
          style={{
            position: 'absolute',
            right: '10px',
            bottom: '40px',
            zIndex: 900,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={scrollToTop}
        >
          <Top size={19} color="#fe6601" />
        </View>
      )}
    </View>
  )
}
