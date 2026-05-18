import { useState, useEffect, useRef } from 'react'
import { ScrollView, View, Text } from '@tarojs/components'
import { Message } from '@/types/chat'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const [toView, setToView] = useState('')
  const scrollCountRef = useRef(0)

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      scrollCountRef.current += 1
      const anchorId = `bottomAnchor-${scrollCountRef.current}`
      // 先清除，再设置新值，确保 scrollIntoView 的值一定发生变化
      setToView('')
      setTimeout(() => {
        setToView(anchorId)
      }, 100)
    }
  }, [messages.length, isLoading])

  return (
    <ScrollView scrollY scrollWithAnimation scrollIntoView={toView} className="h-full w-full">
      {/* 消息主体容器 */}
      <View style={{ padding: '16px 0' }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* AI 正在输入的简易状态 */}
        {isLoading && (
          <View style={{ padding: '0 16px', marginBottom: '16px' }}>
            <View
              style={{
                backgroundColor: '#f3f4f6',
                padding: '8px 12px',
                borderRadius: '8px',
                width: 'fit-content',
              }}
            >
              <Text style={{ fontSize: '12px', color: '#9ca3af' }}>AI 正在思考...</Text>
            </View>
          </View>
        )}

        <View
          id={`bottomAnchor-${scrollCountRef.current}`}
          style={{ height: '20px', width: '100%' }}
        />
      </View>
    </ScrollView>
  )
}

export default MessageList
