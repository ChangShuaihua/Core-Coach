import { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollView, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Message } from '@/types/chat'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  hasMoreMessages: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  onOptionClick?: (content: string) => void
  optionDisabled?: boolean
  scrollToBottomTrigger?: number
  onScrollToBottomStateChange?: (show: boolean) => void
  scrollToBottomRef?: React.MutableRefObject<(() => void) | null>
}

const MessageList = ({
  messages,
  hasMoreMessages,
  isLoadingMore,
  onLoadMore,
  onOptionClick,
  optionDisabled,
  scrollToBottomTrigger,
  onScrollToBottomStateChange,
  scrollToBottomRef,
}: MessageListProps) => {
  const [toView, setToView] = useState('')
  const scrollCountRef = useRef(0)
  const isAutoScrollRef = useRef(true)
  const scrollViewRef = useRef<any>(null)
  const loadingRef = useRef(false)

  const isResponding = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )

  // 同步 ref 和 state
  useEffect(() => {
    loadingRef.current = isLoadingMore
  }, [isLoadingMore])

  // 暴露 scrollToBottom 给父组件
  const scrollToBottom = useCallback(() => {
    scrollCountRef.current += 1
    const anchorId = `bottomAnchor-${scrollCountRef.current}`
    setToView('')
    setTimeout(() => {
      setToView(anchorId)
      onScrollToBottomStateChange?.(false)
    }, 100)
  }, [onScrollToBottomStateChange])

  useEffect(() => {
    if (scrollToBottomRef) {
      scrollToBottomRef.current = scrollToBottom
    }
  }, [scrollToBottomRef, scrollToBottom])

  // 监听消息变化，自动滚动到底部（流式输出时也会触发）
  useEffect(() => {
    if (messages.length > 0 && isAutoScrollRef.current) {
      scrollToBottom()
    }
  }, [messages, isResponding, scrollToBottom])

  // 监听外部触发的滚动到底部
  useEffect(() => {
    if (scrollToBottomTrigger && scrollToBottomTrigger > 0) {
      isAutoScrollRef.current = true
    }
  }, [scrollToBottomTrigger])

  // 滚动事件处理
  const handleScroll = (e: any) => {
    const scrollTop = e.detail.scrollTop
    // 滚动到接近顶部时，加载更多（用 ref 同步判断，防止重复触发）
    if (scrollTop < 50 && hasMoreMessages && !loadingRef.current) {
      loadingRef.current = true
      isAutoScrollRef.current = false
      onLoadMore()
    }
    // 判断是否在底部附近（100px 以内），决定是否自动滚动
    const scrollHeight = e.detail.scrollHeight
    const scrollViewHeight = (Taro.getWindowInfo?.().windowHeight || 600) - 200
    const isNearBottom = scrollHeight - scrollTop - scrollViewHeight < 100
    isAutoScrollRef.current = isNearBottom
    onScrollToBottomStateChange?.(!isNearBottom)
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      scrollY
      scrollWithAnimation
      scrollIntoView={toView}
      className="h-full w-full"
      onScroll={handleScroll}
    >
      <View style={{ padding: '16px 0' }}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onOptionClick={onOptionClick}
            optionDisabled={optionDisabled}
          />
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
