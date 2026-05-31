import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Clock, Add } from '@nutui/icons-react-taro'
import { Popup } from '@nutui/nutui-react-taro'
import Layout from '@/components/Layout'
import { useAuthCheck } from '@/hooks'
import { useChatStore } from '@/store/chatStore'
import { initWsHandlers } from '@/store/chatWsHandlers'
import { Skill } from '@/types/chat'
import ChatInput from './components/ChatInput'
import ConversationList from './components/ConversationList'
import MessageList from './components/MessageList'
import QuickActionsPopup from './components/QuickActions'
import WelcomeScreen from './components/WelcomeScreen'

export default function ChatPage() {
  useAuthCheck()
  const [showPopup, setShowPopup] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [scrollToBottomTrigger, setScrollToBottomTrigger] = useState(0)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const scrollToBottomRef = useRef<(() => void) | null>(null)
  const sendingRef = useRef(false)

  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const messagesBySession = useChatStore((s) => s.messagesBySession)
  const messages = currentConversationId ? messagesBySession[currentConversationId] || [] : []
  const skills = useChatStore((s) => s.skills)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages)
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages)
  const isLoadingMore = useChatStore((s) => s.isLoadingMore)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const stopResponding = useChatStore((s) => s.stopResponding)
  const ensurePendingConversation = useChatStore((s) => s.ensurePendingConversation)
  const loadWorkflows = useChatStore((s) => s.loadWorkflows)
  const toggleSkill = useChatStore((s) => s.toggleSkill)
  const selectedSkill = useChatStore((s) => s.selectedSkill)
  const sessionRoles = useChatStore((s) => s.sessionRoles)

  const isResponding = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )
  const isViewer = currentConversationId ? sessionRoles[currentConversationId] === 'viewer' : false

  // 初始化 WebSocket 事件处理（只执行一次）
  useEffect(() => {
    initWsHandlers()
  }, [])

  // 页面挂载：拉取会话列表和技能列表，然后确保有临时会话
  useEffect(() => {
    loadConversations().then(() => ensurePendingConversation())
    loadWorkflows()
  }, [loadConversations, ensurePendingConversation, loadWorkflows])

  // 切换会话时拉取消息 + 刷新会话列表 + 重置滚动按钮状态
  useEffect(() => {
    setShowScrollToBottom(false)
    if (currentConversationId && !sendingRef.current) {
      loadMessages(currentConversationId)
      loadConversations()
    }
  }, [currentConversationId, loadMessages, loadConversations])

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
      // 先触发滚动到底部
      setScrollToBottomTrigger((prev) => prev + 1)
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
    ensurePendingConversation()
    setShowLeft(false)
  }, [ensurePendingConversation])

  const showWelcome = messages.length === 0

  return (
    <Layout
      title="核心力量·助手"
      renderLeft={
        <View
          onClick={() => {
            setShowLeft(true)
            loadConversations()
          }}
        >
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
              scrollToBottomTrigger={scrollToBottomTrigger}
              onScrollToBottomStateChange={setShowScrollToBottom}
              scrollToBottomRef={scrollToBottomRef}
            />
          )}
        </View>

        <View
          className="relative flex-shrink-0"
          style={{ paddingBottom: `${keyboardHeight - 60}px` }}
        >
          <View className="absolute left-6" style={{ bottom: '140px' }}>
            <QuickActionsPopup
              visible={showPopup}
              skills={skills}
              selectedSkill={selectedSkill}
              onClose={() => setShowPopup(false)}
              onSelect={handleSelectSkill}
            />
          </View>
          {showScrollToBottom && (
            <View
              className="absolute"
              style={{
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
              }}
              onClick={() => scrollToBottomRef.current?.()}
            >
              <Text style={{ fontSize: '16px', color: '#333' }}>⬇</Text>
            </View>
          )}
          {isViewer && (
            <View
              className="mx-4 mb-2 px-4 py-2 rounded-lg text-center"
              style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '13px' }}
            >
              你当前是浏览模式，无法发送消息
            </View>
          )}
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            onSkillClick={() => setShowPopup((prev) => !prev)}
            isResponding={isResponding}
            selectedSkillName={selectedSkill?.title}
            disabled={isViewer}
          />
        </View>
      </View>

      <Popup
        visible={showLeft}
        style={{ width: '80%', height: '100%' }}
        position="left"
        onClose={() => setShowLeft(false)}
      >
        <View className="h-full flex flex-col">
          <View
            className="text-white mt-16 mx-6 py-3 flex-shrink-0 flex items-center justify-center bg-orange-5 rounded-lg"
            onClick={handleNewConversation}
          >
            <Add style={{ marginRight: '4px', color: '#fff' }} /> 添加新对话
          </View>
          <View className="flex-1 overflow-hidden">
            <ConversationList onSelect={() => setShowLeft(false)} />
          </View>
        </View>
      </Popup>
    </Layout>
  )
}
