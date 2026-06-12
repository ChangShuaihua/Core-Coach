import { useChatStore } from '../chatStore'

export function clearLastStreamId(sessionId?: string) {
  if (!sessionId) return

  useChatStore.setState((state) => {
    const { [sessionId]: _, ...rest } = state.lastStreamIds
    return { lastStreamIds: rest }
  })
}

export function markRemoteSessionNeedsReload(sessionId: string) {
  const state = useChatStore.getState()
  state.markRemoteDirty(sessionId)
  state.clearRemoteStreaming(sessionId)
  if (state.currentConversationId === sessionId) {
    void state.loadMessages(sessionId, { force: true })
  }
}
