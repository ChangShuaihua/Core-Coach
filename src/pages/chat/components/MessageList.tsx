import { useState, useEffect, useRef } from 'react'
import { ScrollView, View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Message } from '@/types/chat'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  hasMoreMessages: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

const MessageList = ({
  messages,
  hasMoreMessages,
  isLoadingMore,
  onLoadMore,
}: MessageListProps) => {
  const [toView, setToView] = useState('')
  const scrollCountRef = useRef(0)
  const isAutoScrollRef = useRef(true)
  const scrollViewRef = useRef<any>(null)

  const isResponding = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )

  // 监听消息变化，自动滚动到底部（仅新消息时）
  useEffect(() => {
    if (messages.length > 0 && isAutoScrollRef.current) {
      scrollCountRef.current += 1
      const anchorId = `bottomAnchor-${scrollCountRef.current}`
      setToView('')
      setTimeout(() => {
        setToView(anchorId)
      }, 100)
    }
  }, [messages.length, isResponding])

  // 滚动事件处理
  const handleScroll = (e: any) => {
    const scrollTop = e.detail.scrollTop
    // 滚动到接近顶部时，加载更多
    if (scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
      isAutoScrollRef.current = false
      onLoadMore()
    }
    // 判断是否在底部附近（100px 以内），决定是否自动滚动
    const scrollHeight = e.detail.scrollHeight
    const scrollViewHeight = (Taro.getWindowInfo?.().windowHeight || 600) - 200
    isAutoScrollRef.current = scrollHeight - scrollTop - scrollViewHeight < 100
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      scrollY
      scrollWithAnimation={false}
      scrollIntoView={toView}
      className="h-full w-full"
      onScroll={handleScroll}
    >
      <View style={{ padding: '16px 0' }}>
        {/* 加载更多提示 */}
        <View className="text-center py-2 text-gray-400 text-sm">
          {isLoadingMore ? (
            <Text>加载中...</Text>
          ) : hasMoreMessages ? (
            <Text>下拉加载更多历史消息</Text>
          ) : messages.length > 0 ? (
            <Text>没有更多消息了</Text>
          ) : null}
        </View>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <View
          id={`bottomAnchor-${scrollCountRef.current}`}
          style={{ height: '20px', width: '100%' }}
        />
      </View>
    </ScrollView>
  )
}

export default MessageList
