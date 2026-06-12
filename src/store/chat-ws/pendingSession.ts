import type { Conversation } from '@/types/chat'
import { useChatStore } from '../chatStore'
import { enterChatSession, leaveChatSession } from './sessionHandlers'

export function migratePendingSession(pendingId: string, realSessionId: string, title?: string) {
  const wasViewing = useChatStore.getState().currentConversationId === pendingId

  useChatStore.setState((state) => {
    const { [pendingId]: pendingConv, ...restConvs } = state.conversations
    const { [pendingId]: pendingMsgs, ...restMsgs } = state.messagesBySession

    const runtime = state.sessionRuntimes[pendingId]
    let newRuntimes = state.sessionRuntimes
    let newRequestToSession = state.requestToSession
    if (runtime) {
      const { [pendingId]: _, ...restRuntimes } = state.sessionRuntimes
      newRuntimes = { ...restRuntimes, [realSessionId]: runtime }
      const { [runtime.requestId]: __, ...restMapping } = state.requestToSession
      newRequestToSession = { ...restMapping, [runtime.requestId]: realSessionId }
    }

    if (state.conversations[realSessionId]) {
      const existingConv = state.conversations[realSessionId]
      const existingMsgs = state.messagesBySession[realSessionId] || []
      const mergedMsgs = [...existingMsgs, ...(pendingMsgs || [])]
      return {
        conversations: {
          ...restConvs,
          [realSessionId]: { ...existingConv, messageCount: mergedMsgs.length },
        },
        messagesBySession: { ...restMsgs, [realSessionId]: mergedMsgs },
        sessionRuntimes: newRuntimes,
        requestToSession: newRequestToSession,
        ...(wasViewing ? { currentConversationId: realSessionId } : {}),
      }
    }

    const newConv: Conversation = {
      ...(pendingConv as Conversation),
      id: realSessionId,
      title: title || '新对话',
    }

    return {
      conversations: { [realSessionId]: newConv, ...restConvs },
      messagesBySession: { [realSessionId]: pendingMsgs || [], ...restMsgs },
      sessionRuntimes: newRuntimes,
      requestToSession: newRequestToSession,
      ...(wasViewing ? { currentConversationId: realSessionId } : {}),
    }
  })

  leaveChatSession(realSessionId)
  enterChatSession(realSessionId)
}
