import { RECONNECT_BASE_DELAY, RECONNECT_MAX_DELAY } from './constants'

export function getReconnectDelay(attempts: number, delayOverride?: number): number {
  return (
    delayOverride ?? Math.min(RECONNECT_BASE_DELAY * Math.pow(2, attempts), RECONNECT_MAX_DELAY)
  )
}
