import type { WsEventType, WsMessage } from '@/types/ws'

export function parseWsMessage(raw: string): WsMessage | null {
  try {
    return JSON.parse(raw) as WsMessage
  } catch {
    return null
  }
}

export function stringifyWsMessage(event_type: WsEventType, data: any): string {
  return JSON.stringify({ event_type, data })
}
