import { useState } from 'react'
import { View } from '@tarojs/components'
import Layout from '@/components/Layout'
import ChatInput from './components/ChatInput'
import MessageList from './components/MessageList'
import QuickActionsPopup from './components/QuickActions'
import WelcomeScreen from './components/WelcomeScreen'
import { Message, QuickAction } from './types'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const handleSend = async (content: string) => {
    // 1. 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    // 2. 添加到消息列表
    setMessages((prev) => [...prev, userMessage])

    // 3. 显示加载状态
    setIsLoading(true)

    // 4. 模拟 AI 回复（后续替换为真实 API）
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '这是一条模拟的 AI 回复，后续会接入扣子工作流。',
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  // 选择快捷操作
  const handleSelectAction = (action: QuickAction) => {
    // 直接发送快捷操作的 prompt
    handleSend(action.prompt)
  }

  // ========== 渲染 ==========

  // 判断是否显示欢迎屏幕
  const showWelcome = messages.length === 0

  return (
    <Layout title="核心力量·助手">
      <View className="h-full flex flex-col overflow-hidden">
        {/* 主内容区域：欢迎屏幕 OR 消息列表 */}
        <View className="flex-1 overflow-hidden">
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}
        </View>

        {/* 底部栏 */}
        <View className="relative flex-shrink-0">
          <View className="absolute left-6" style={{ bottom: '100px' }}>
            <QuickActionsPopup
              visible={showPopup}
              onClose={() => setShowPopup(false)}
              onSelect={handleSelectAction}
            />
          </View>
          <ChatInput onSend={handleSend} onSkillClick={() => setShowPopup(true)} />
        </View>
      </View>
    </Layout>
  )
}
