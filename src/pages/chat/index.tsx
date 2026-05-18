import { useState, useEffect, useRef, useCallback } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Clock, Add } from '@nutui/icons-react-taro'
import { Popup } from '@nutui/nutui-react-taro'
import Layout from '@/components/Layout'
import { useChatStore } from '@/store/chatStore'
import { Message, QuickAction } from '@/types/chat'
import ChatInput from './components/ChatInput'
import ConversationList from './components/ConversationList'
import MessageList from './components/MessageList'
import QuickActionsPopup from './components/QuickActions'
import WelcomeScreen from './components/WelcomeScreen'

// 自增 ID 生成器，避免 Date.now() 重复
let messageId = 0
const genId = () => String(++messageId)

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addMessage = useChatStore((s) => s.addMessage)
  const currentConversationId = useChatStore((s) => s.currentConversationId)

  // 监听键盘高度变化
  useEffect(() => {
    Taro.onKeyboardHeightChange((res) => {
      setKeyboardHeight(res.height)
    })
    return () => {
      Taro.offKeyboardHeightChange(() => {})
    }
  }, [])

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleSend = useCallback(
    (content: string) => {
      // 互斥：如果上一条还在等待回复，忽略本次发送
      if (isLoading) return

      const userMessage: Message = {
        id: genId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      // 同步到 store，更新会话排序
      if (currentConversationId) {
        addMessage(userMessage)
      }

      // 模拟 AI 回复（后续替换为真实 API）
      timerRef.current = setTimeout(() => {
        const aiMessage: Message = {
          id: genId(),
          role: 'assistant',
          content: '这是一条模拟的 AI 回复，后续会接入扣子工作流。',
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, aiMessage])
        setIsLoading(false)
        timerRef.current = null

        // 同步 AI 回复到 store
        if (currentConversationId) {
          addMessage(aiMessage)
        }
      }, 3000)
    },
    [isLoading, currentConversationId, addMessage]
  )

  // 选择快捷操作
  const handleSelectAction = useCallback(
    (action: QuickAction) => {
      handleSend(action.prompt)
    },
    [handleSend]
  )

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
          <ChatInput
            onSend={handleSend}
            onSkillClick={() => setShowPopup((prev) => !prev)}
            disabled={isLoading}
          />
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
        <View className="text-white mt-16 mx-6 py-3 flex items-center justify-center bg-orange-5 rounded-lg">
          <Add style={{ marginRight: '4px', color: '#fff' }} /> 添加新对话
        </View>
        <View>
          <ConversationList />
        </View>
      </Popup>
    </Layout>
  )
}
