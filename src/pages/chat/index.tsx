import { useState, useEffect } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Clock, Add } from '@nutui/icons-react-taro'
import { Popup } from '@nutui/nutui-react-taro'
import Layout from '@/components/Layout'
import ChatInput from './components/ChatInput'
import ConversationList from './components/ConversationList'
import MessageList from './components/MessageList'
import QuickActionsPopup from './components/QuickActions'
import WelcomeScreen from './components/WelcomeScreen'
import { Message, QuickAction } from './types'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // 监听键盘高度变化
  useEffect(() => {
    Taro.onKeyboardHeightChange((res) => {
      setKeyboardHeight(res.height)
    })
    return () => {
      Taro.offKeyboardHeightChange(() => {})
    }
  }, [])

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
    <Layout
      title="核心力量·助手"
      renderLeft={
        <View onClick={() => setShowLeft(true)}>
          <Clock />
        </View>
      }
    >
      <View
        className="h-full flex flex-col overflow-hidden"
        onClick={() => showPopup && setShowPopup(false)}
      >
        {/* 主内容区域：欢迎屏幕 OR 消息列表 */}
        <View className="flex-1 overflow-hidden">
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}
        </View>

        {/* 底部栏 */}
        <View
          className="relative flex-shrink-0"
          style={{ paddingBottom: `${keyboardHeight - 60}px` }}
        >
          <View className="absolute left-6" style={{ top: '-150px' }}>
            <QuickActionsPopup
              visible={showPopup}
              onClose={() => setShowPopup(false)}
              onSelect={handleSelectAction}
            />
          </View>
          <ChatInput onSend={handleSend} onSkillClick={() => setShowPopup((prev) => !prev)} />
        </View>
      </View>

      <Popup
        visible={showLeft}
        style={{ width: '80%', height: '100%' }}
        position="left"
        onClose={() => {
          setShowLeft(false)
        }}
      >
        <View className="mt-16 mx-8 py-3 flex items-center justify-center bg-orange-4 rounded-full">
          <Add style={{ marginRight: '5px' }} /> 添加新对话
        </View>
        <View>
          <ConversationList />
        </View>
      </Popup>
    </Layout>
  )
}
