import { useChatStore } from '../chatStore'

export function findSessionByRequestId(requestId: string): string | undefined {
  return useChatStore.getState().requestToSession[requestId]
}

export function findSourcePending(requestId: string): string | undefined {
  const sessionId = findSessionByRequestId(requestId)
  if (sessionId?.startsWith('pending-')) return sessionId
  return undefined
}
