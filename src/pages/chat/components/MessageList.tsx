import { useState, useEffect, useRef } from 'react'
import { ScrollView, View } from '@tarojs/components'
import { Message } from '@/types/chat'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
}

const MessageList = ({ messages }: MessageListProps) => {
  const [toView, setToView] = useState('')
  const scrollCountRef = useRef(0)

  const isResponding = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      scrollCountRef.current += 1
      const anchorId = `bottomAnchor-${scrollCountRef.current}`
      setToView('')
      setTimeout(() => {
        setToView(anchorId)
      }, 100)
    }
  }, [messages.length, isResponding])

  return (
    <ScrollView scrollY scrollWithAnimation scrollIntoView={toView} className="h-full w-full">
      <View style={{ padding: '16px 0' }}>
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
