import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { Clock, Add } from '@nutui/icons-react-taro'
import { Popup } from '@nutui/nutui-react-taro'
import chatLogo from '@/assets/images/chatlogo.png'
import Layout from '@/components/Layout'
import { useLoginStatus } from '@/hooks/useLoginStatus'
import { ws } from '@/services/ws'
import { useChatStore } from '@/store/chatStore'
import { initWsHandlers } from '@/store/chatWsHandlers'
import { Skill } from '@/types/chat'
import ChatInput from './components/ChatInput'
import ConversationList from './components/ConversationList'
import MessageList from './components/MessageList'
import QuickActionsPopup from './components/QuickActions'
import WelcomeScreen from './components/WelcomeScreen'

const STOP_CLICK_DEBOUNCE_MS = 800

export default function ChatPage() {
  useShareAppMessage(() => ({
    title: '快来和我一起体验少儿跑酷！超有趣的运动游戏～',
    path: '/pages/chat/index',
    imageUrl: chatLogo,
  }))

  useEffect(() => {
    Taro.showShareMenu({ withShareTicket: true })
  }, [])

  const { isLoggedIn } = useLoginStatus()

  const [showPopup, setShowPopup] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [scrollToBottomTrigger, setScrollToBottomTrigger] = useState(0)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [stopClickLocked, setStopClickLocked] = useState(false)
  const scrollToBottomRef = useRef<(() => void) | null>(null)
  const sendingRef = useRef(false)
  const stopClickLockedRef = useRef(false)
  const stopClickUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  const wsConnected = useChatStore((s) => s.wsConnected)
  const setWsConnected = useChatStore((s) => s.setWsConnected)

  const isResponding = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )
  const isViewer = currentConversationId ? sessionRoles[currentConversationId] === 'viewer' : false

  useEffect(() => {
    initWsHandlers()
    setWsConnected(ws.connected)
  }, [setWsConnected])

  useEffect(() => {
    if (!isLoggedIn) return
    loadConversations().then(() => ensurePendingConversation())
  }, [isLoggedIn, loadConversations, ensurePendingConversation])

  useDidShow(() => {
    loadWorkflows()
  })

  useEffect(() => {
    setShowScrollToBottom(false)
    if (currentConversationId && !sendingRef.current) {
      loadMessages(currentConversationId)
      loadConversations()
    }
  }, [currentConversationId, loadMessages, loadConversations])

  useEffect(() => {
    const handleKeyboardHeightChange = (res) => {
      setKeyboardHeight(res.height)
      if (res.height > 0) {
        setTimeout(() => {
          scrollToBottomRef.current?.()
        }, 100)
      }
    }
    Taro.onKeyboardHeightChange(handleKeyboardHeightChange)
    return () => {
      Taro.offKeyboardHeightChange(handleKeyboardHeightChange)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (stopClickUnlockTimerRef.current) {
        clearTimeout(stopClickUnlockTimerRef.current)
      }
    }
  }, [])

  const handleSend = useCallback(
    async (content: string) => {
      if (!isLoggedIn) {
        Taro.navigateTo({ url: '/pages/login/index' })
        return
      }
      if (isResponding) return
      sendingRef.current = true
      setScrollToBottomTrigger((prev) => prev + 1)
      try {
        await sendMessage(content)
      } finally {
        sendingRef.current = false
      }
    },
    [isLoggedIn, isResponding, sendMessage]
  )

  const handleStop = useCallback(() => {
    if (stopClickLockedRef.current) return

    stopClickLockedRef.current = true
    setStopClickLocked(true)

    if (stopClickUnlockTimerRef.current) {
      clearTimeout(stopClickUnlockTimerRef.current)
    }
    stopClickUnlockTimerRef.current = setTimeout(() => {
      stopClickLockedRef.current = false
      stopClickUnlockTimerRef.current = null
      setStopClickLocked(false)
    }, STOP_CLICK_DEBOUNCE_MS)

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
  const disabledReason = !isLoggedIn
    ? '登录后体验完整功能'
    : !wsConnected
      ? '连接中，请稍后再发'
      : isViewer
        ? '当前为浏览模式，无法发送消息'
        : ''
  const optionDisabled = isResponding || isViewer || !wsConnected

  return (
    <Layout
      title="核心力量·助手"
      renderLeft={
        <View
          onClick={() => {
            setShowLeft(true)
            if (isLoggedIn) {
              loadConversations()
            }
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
              onOptionClick={handleSend}
              optionDisabled={optionDisabled}
              scrollToBottomTrigger={scrollToBottomTrigger}
              onScrollToBottomStateChange={setShowScrollToBottom}
              scrollToBottomRef={scrollToBottomRef}
            />
          )}
        </View>

        <View
          className="relative flex-shrink-0"
          style={{ paddingBottom: `${Math.max(keyboardHeight - 60, 0)}px` }}
        >
          <View
            className="absolute left-4"
            style={{
              bottom: 'calc(100% + 8px)',
              zIndex: 110,
            }}
          >
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
                bottom: 'calc(100% + 10px)',
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
              <Text style={{ fontSize: '16px', color: '#333' }}>↓</Text>
            </View>
          )}

          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            onSkillClick={() => setShowPopup((prev) => !prev)}
            isResponding={isResponding}
            stopDisabled={stopClickLocked}
            selectedSkillName={selectedSkill?.title}
            disabled={!!disabledReason}
            disabledReason={disabledReason}
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
          {!isLoggedIn ? (
            <View className="h-full flex items-center justify-center">
              <View
                className="text-white py-3 px-6 bg-orange-5 rounded-lg"
                onClick={() => {
                  setShowLeft(false)
                  Taro.navigateTo({ url: '/pages/login/index' })
                }}
              >
                登录查看历史会话
              </View>
            </View>
          ) : (
            <>
              <View
                className="text-white mt-16 mx-6 py-3 flex-shrink-0 flex items-center justify-center bg-orange-5 rounded-lg"
                onClick={handleNewConversation}
              >
                <Add style={{ marginRight: '4px', color: '#fff' }} /> 添加新对话
              </View>
              <View className="flex-1 overflow-hidden">
                <ConversationList onSelect={() => setShowLeft(false)} />
              </View>
            </>
          )}
        </View>
      </Popup>
    </Layout>
  )
}
