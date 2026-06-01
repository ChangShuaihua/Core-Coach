import { View, Text, ScrollView } from '@tarojs/components'
import { ArrowLeft, ArrowRight } from '@nutui/icons-react-taro'

export interface PaginatedListProps<T> {
  items: T[]
  loading: boolean
  total: number
  page: number
  pageSize: number

  mode?: 'paginated' | 'infinite'

  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onScrollToLower?: () => void

  renderItem: (item: T, index: number) => React.ReactNode
  renderHeader?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderBottomBar?: () => React.ReactNode

  pageSizes?: number[]
  emptyText?: string
  loadingMore?: boolean
}

export default function PaginatedList<T>({
  items,
  loading,
  total,
  page,
  pageSize,
  mode = 'paginated',
  onPageChange,
  onPageSizeChange,
  onScrollToLower,
  renderItem,
  renderHeader,
  renderEmpty,
  renderBottomBar,
  pageSizes = [1, 5, 10, 25],
  emptyText = '暂无数据',
  loadingMore = false,
}: PaginatedListProps<T>) {
  const totalPages = Math.ceil(total / pageSize) || 1

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1)
  }

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1)
  }

  const defaultEmpty = () => (
    <View className="flex flex-col items-center justify-center pt-24">
      <Text style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📭</Text>
      <Text className="text-base text-gray-5">{emptyText}</Text>
    </View>
  )

  const defaultBottomBar = () => (
    <View className="fixed bottom-0 left-0 right-0 z-50">
      <View className="bg-white border-t border-gray-2 py-4 px-6">
        <View className="flex flex-col items-center justify-center gap-3">
          <View className="flex items-center gap-2">
            <View
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50"
              onClick={handlePrev}
              style={{ opacity: page === 1 ? 0.4 : 1 }}
            >
              <ArrowLeft className="w-4 h-4 text-gray-7" />
            </View>
            <View className="flex items-center gap-1">
              <Text className="text-base font-semibold text-gray-9">{page}</Text>
              <Text className="text-xs text-gray-4">/</Text>
              <Text className="text-sm text-gray-5">{totalPages}</Text>
            </View>
            <View
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50"
              onClick={handleNext}
              style={{ opacity: page === totalPages ? 0.4 : 1 }}
            >
              <ArrowRight className="w-4 h-4 text-gray-7" />
            </View>
          </View>
          {onPageSizeChange && (
            <View className="flex items-center gap-1">
              <Text className="text-xs text-gray-6">每页</Text>
              {pageSizes.map((size) => (
                <View
                  key={size}
                  className="px-3 py-1 rounded-md"
                  style={{ backgroundColor: pageSize === size ? '#ff9500' : '#f5f5f5' }}
                  onClick={() => onPageSizeChange(size)}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: pageSize === size ? '#ffffff' : '#666666' }}
                  >
                    {size}
                  </Text>
                </View>
              ))}
              <Text className="text-xs text-gray-4 ml-1">共{total}条</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )

  const listContent = (
    <>
      {loading ? (
        <View className="flex flex-col items-center justify-center pt-24">
          <View className="w-10 h-10 border-4 border-orange-6 border-t-orange-2 rounded-full animate-spin" />
          <Text className="text-sm text-gray-5 mt-4">加载中...</Text>
        </View>
      ) : items.length === 0 ? (
        renderEmpty?.() || defaultEmpty()
      ) : (
        <View className="p-4">
          {items.map((item, index) => renderItem(item, index))}
          {mode === 'infinite' && (
            <View style={{ textAlign: 'center', padding: '16px 0' }}>
              <Text style={{ fontSize: '14px', color: '#9ca3af' }}>
                {loadingMore
                  ? '加载中...'
                  : page < totalPages
                    ? '上滑加载更多'
                    : `没有更多了（共 ${total} 条）`}
              </Text>
            </View>
          )}
        </View>
      )}
    </>
  )

  if (mode === 'infinite') {
    return (
      <ScrollView scrollY style={{ height: '100%' }} onScrollToLower={onScrollToLower}>
        {renderHeader?.()}
        {listContent}
      </ScrollView>
    )
  }

  return (
    <View className="bg-gray-1 min-h-screen pb-36">
      {renderHeader?.()}
      {listContent}
      {renderBottomBar?.() || defaultBottomBar()}
    </View>
  )
}
