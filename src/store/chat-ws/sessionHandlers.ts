import { ws } from '@/services/ws'

function isRealSession(sessionId: string | null | undefined): sessionId is string {
  return !!sessionId && !sessionId.startsWith('pending-')
}

export function enterChatSession(sessionId: string | null | undefined): boolean {
  if (!isRealSession(sessionId)) return false

  return ws.send(
    'session_enter',
    {
      session_id: sessionId,
      create_time: Math.floor(Date.now() / 1000),
    },
    { quiet: true }
  )
}

export function leaveChatSession(sessionId: string | null | undefined): boolean {
  if (!isRealSession(sessionId)) return false

  return ws.send(
    'session_leave',
    {
      session_id: sessionId,
      create_time: Math.floor(Date.now() / 1000),
    },
    { quiet: true, reconnectOnFail: false }
  )
}
