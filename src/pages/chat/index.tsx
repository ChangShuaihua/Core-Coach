import { useState, useEffect, useCallback, useRef } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Clock, Add } from '@nutui/icons-react-taro'
import { Popup } from '@nutui/nutui-react-taro'
import Layout from '@/components/Layout'
import { useChatStore } from '@/store/chatStore'
import { Skill } from '@/types/chat'
import ChatInput from './components/ChatInput'
import ConversationList from './components/ConversationList'
import MessageList from './components/MessageList'
import QuickActionsPopup from './components/QuickActions'
import WelcomeScreen from './components/WelcomeScreen'

export default function ChatPage() {
  const [showPopup, setShowPopup] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const sendingRef = useRef(false)

  const messages = useChatStore((s) => s.currentMessages)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const skills = useChatStore((s) => s.skills)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages)
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages)
  const isLoadingMore = useChatStore((s) => s.isLoadingMore)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const stopResponding = useChatStore((s) => s.stopResponding)
  const loadSkills = useChatStore((s) => s.loadSkills)
  const toggleSkill = useChatStore((s) => s.toggleSkill)
  const selectedSkill = useChatStore((s) => s.selectedSkill)

  const isResponding = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )

  // 页面挂载：拉取会话列表和技能列表
  useEffect(() => {
    loadConversations()
    loadSkills()
  }, [loadConversations, loadSkills])

  // 切换会话时拉取消息（发送期间跳过，防止覆盖乐观更新的消息）
  useEffect(() => {
    if (currentConversationId && !sendingRef.current) {
      loadMessages(currentConversationId)
    }
  }, [currentConversationId, loadMessages])

  // 监听键盘高度变化
  useEffect(() => {
    Taro.onKeyboardHeightChange((res) => {
      setKeyboardHeight(res.height)
    })
    return () => {
      Taro.offKeyboardHeightChange(() => {})
    }
  }, [])

  const handleSend = useCallback(
    async (content: string) => {
      if (isResponding) return
      sendingRef.current = true
      try {
        await sendMessage(content)
      } finally {
        sendingRef.current = false
      }
    },
    [isResponding, sendMessage]
  )

  const handleStop = useCallback(() => {
    stopResponding()
  }, [stopResponding])

  const handleSelectSkill = useCallback(
    (skill: Skill) => {
      toggleSkill(skill)
    },
    [toggleSkill]
  )

  const handleNewConversation = useCallback(() => {
    useChatStore.setState({
      currentConversationId: null,
      currentMessages: [],
      messageCursor: null,
      hasMoreMessages: true,
    })
    setShowLeft(false)
  }, [])

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
        <View className="flex-1 overflow-hidden">
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <MessageList
              messages={messages}
              hasMoreMessages={hasMoreMessages}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMoreMessages}
            />
          )}
        </View>

        <View
          className="relative flex-shrink-0"
          style={{ paddingBottom: `${keyboardHeight - 60}px` }}
        >
          <View className="absolute left-6" style={{ top: '-150px' }}>
            <QuickActionsPopup
              visible={showPopup}
              skills={skills}
              selectedSkill={selectedSkill}
              onClose={() => setShowPopup(false)}
              onSelect={handleSelectSkill}
            />
          </View>
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            onSkillClick={() => setShowPopup((prev) => !prev)}
            isResponding={isResponding}
            selectedSkillName={selectedSkill?.title}
          />
        </View>
      </View>

      <Popup
        visible={showLeft}
        style={{ width: '80%', height: '100%' }}
        position="left"
        onClose={() => setShowLeft(false)}
      >
        <View
          className="text-white mt-16 mx-6 py-3 flex items-center justify-center bg-orange-5 rounded-lg"
          onClick={handleNewConversation}
        >
          <Add style={{ marginRight: '4px', color: '#fff' }} /> 添加新对话
        </View>
        <View>
          <ConversationList />
        </View>
      </Popup>
    </Layout>
  )
}
