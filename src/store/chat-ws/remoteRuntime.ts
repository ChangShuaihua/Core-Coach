import type { Message } from '@/types/chat'
import type { WsStreamChunkData } from '@/types/ws'
import { useChatStore } from '../chatStore'

function markRemoteDirty(sessionId: string) {
  const state = useChatStore.getState()
  state.markRemoteStreaming(sessionId)
  state.markRemoteDirty(sessionId)
}

function ensureRemotePendingIfLastMessageIsUser(sessionId: string) {
  useChatStore.setState((state) => {
    const messages = state.messagesBySession[sessionId] || []
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role !== 'user') return state

    const hasOpenAssistant = messages.some(
      (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
    )
    if (hasOpenAssistant) return state

    return {
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: [
          ...messages,
          {
            id: `remote-pending-${sessionId}-${lastMessage.id}`,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            status: 'pending',
          },
        ],
      },
    }
  })
}

function getRemoteChunkAssistantTarget(messages: Message[]): {
  canAcceptChunk: boolean
  assistantMsgId?: string
} {
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user')
  if (lastUserIndex < 0) return { canAcceptChunk: false }

  const messagesAfterLastUser = messages.slice(lastUserIndex + 1)
  const openAssistant = messagesAfterLastUser.find(
    (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
  )

  if (openAssistant) {
    const hasClosedAssistantAfterLastUser = messagesAfterLastUser.some(
      (m) => m.role === 'assistant' && m.status !== 'pending' && m.status !== 'streaming'
    )
    return {
      canAcceptChunk: !hasClosedAssistantAfterLastUser,
      assistantMsgId: openAssistant.id,
    }
  }

  const lastMessage = messages[messages.length - 1]
  return { canAcceptChunk: lastMessage?.role === 'user' }
}

export function createRemoteRuntimeForChunk(data: WsStreamChunkData): boolean {
  const sessionId = data.session_id
  const messages = useChatStore.getState().messagesBySession[sessionId] || []
  const target = getRemoteChunkAssistantTarget(messages)
  if (!target.canAcceptChunk || data.chunk_index > 0) {
    markRemoteDirty(sessionId)
    ensureRemotePendingIfLastMessageIsUser(sessionId)
    return false
  }

  const assistantMsgId = `a-${data.request_id}`
  useChatStore.setState((state) => {
    const currentMessages = state.messagesBySession[sessionId] || []
    const currentTarget = getRemoteChunkAssistantTarget(currentMessages)
    if (!currentTarget.canAcceptChunk) return state

    const messageId = currentTarget.assistantMsgId || assistantMsgId

    return {
      messagesBySession: currentTarget.assistantMsgId
        ? state.messagesBySession
        : {
            ...state.messagesBySession,
            [sessionId]: [
              ...currentMessages,
              {
                id: messageId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                status: 'pending',
              },
            ],
          },
      sessionRuntimes: {
        ...state.sessionRuntimes,
        [sessionId]: { requestId: data.request_id, assistantMsgId: messageId, status: 'pending' },
      },
      requestToSession: {
        ...state.requestToSession,
        [data.request_id]: sessionId,
      },
    }
  })
  return true
}
