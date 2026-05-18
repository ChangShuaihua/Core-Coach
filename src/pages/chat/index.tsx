import { useState, useEffect, useRef, useCallback } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Clock, Add } from '@nutui/icons-react-taro'
import { Popup } from '@nutui/nutui-react-taro'
import { sendMessage, addUserMessageToMock } from '@/api/chat'
import Layout from '@/components/Layout'
import { useChatStore } from '@/store/chatStore'
import { Message, Skill } from '@/types/chat'
import ChatInput from './components/ChatInput'
import ConversationList from './components/ConversationList'
import MessageList from './components/MessageList'
import QuickActionsPopup from './components/QuickActions'
import WelcomeScreen from './components/WelcomeScreen'

let messageId = 0
const genId = () => String(++messageId)

export default function ChatPage() {
  const [showPopup, setShowPopup] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const sendingRef = useRef(false)
  const stoppedRef = useRef(false)

  const messages = useChatStore((s) => s.currentMessages)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const skills = useChatStore((s) => s.skills)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const createConversation = useChatStore((s) => s.createConversation)
  const appendMessage = useChatStore((s) => s.appendMessage)
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus)
  const loadSkills = useChatStore((s) => s.loadSkills)

  const isResponding = messages.some(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )

  // 页面挂载：拉取会话列表和技能列表
  useEffect(() => {
    loadConversations()
    loadSkills()
  }, [])

  // 切换会话时拉取消息（发送期间跳过，防止覆盖新消息）
  useEffect(() => {
    if (currentConversationId && !sendingRef.current) {
      loadMessages(currentConversationId)
    }
  }, [currentConversationId])

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

      const userMsg: Message = {
        id: genId(),
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'success',
      }
      const aiMsgId = genId()
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'pending',
      }

      sendingRef.current = true
      stoppedRef.current = false

      try {
        let convId = currentConversationId
        if (!convId) {
          convId = await createConversation()
          useChatStore.setState({ currentMessages: [userMsg, aiMsg] })
        } else {
          appendMessage(userMsg)
          appendMessage(aiMsg)
        }

        addUserMessageToMock(convId, userMsg)

        const result = await sendMessage(convId, content)

        // 如果在等待期间被停止，不更新状态（已经是 error 了）
        if (stoppedRef.current) return
        updateMessageStatus(aiMsgId, 'success', result.content)
      } catch {
        updateMessageStatus(aiMsgId, 'error', '发送失败')
      } finally {
        sendingRef.current = false
      }
    },
    [isResponding, currentConversationId]
  )

  const handleStop = useCallback(() => {
    stoppedRef.current = true
    const current = useChatStore.getState().currentMessages
    current.forEach((m) => {
      if (m.role === 'assistant' && m.status === 'pending') {
        updateMessageStatus(m.id, 'error', '已停止生成')
      }
    })
  }, [updateMessageStatus])

  const handleSelectSkill = useCallback(
    (skill: Skill) => {
      handleSend(skill.prompt)
    },
    [handleSend]
  )

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
          {showWelcome ? <WelcomeScreen /> : <MessageList messages={messages} />}
        </View>

        <View
          className="relative flex-shrink-0"
          style={{ paddingBottom: `${keyboardHeight - 60}px` }}
        >
          <View className="absolute left-6" style={{ top: '-150px' }}>
            <QuickActionsPopup
              visible={showPopup}
              skills={skills}
              onClose={() => setShowPopup(false)}
              onSelect={handleSelectSkill}
            />
          </View>
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            onSkillClick={() => setShowPopup((prev) => !prev)}
            isResponding={isResponding}
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
        <View
          className="text-white mt-16 mx-6 py-3 flex items-center justify-center bg-orange-5 rounded-lg"
          onClick={() => {
            createConversation()
            setShowLeft(false)
          }}
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
