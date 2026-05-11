// src/pages/chat/components/MessageList.tsx
import { useState, useEffect } from 'react'
import { ScrollView, View, Text } from '@tarojs/components'
import { Message } from '../types'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

const MessageList = ({ messages, isLoading }: MessageListProps) => {
  // scrollIntoView 要求值必须是一个存在的 ID，且不能以数字开头
  const [toView, setToView] = useState('')

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      // 在小程序中，必须在数据渲染后的下一帧执行滚动
      // 使用 setTimeout 0 即可
      setTimeout(() => {
        setToView('bottomAnchor')
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

        {/* 
            重点：底部锚点
            id 必须是静态的字符串，不要包含任何变量
        */}
        <View id="bottomAnchor" style={{ height: '20px', width: '100%' }} />
      </View>
    </ScrollView>
  )
}

export default MessageList
