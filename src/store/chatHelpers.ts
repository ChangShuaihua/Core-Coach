import Taro from '@tarojs/taro'
import type { Skill } from '@/types/chat'
import { useChatStore } from './chatStore'

// ============ 常量 ============

const SKILL_STORAGE_KEY = 'chat_selected_skill'
const SEND_TIMEOUT_MS = 120_000

const sendTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const abortFallbackTimers = new Map<string, ReturnType<typeof setTimeout>>()

// ============ 超时清理 ============

export function clearSendTimeout(sessionId: string) {
  const timer = sendTimeouts.get(sessionId)
  if (timer) {
    clearTimeout(timer)
    sendTimeouts.delete(sessionId)
  }
}

export function setSendTimeout(sessionId: string, timer: ReturnType<typeof setTimeout>) {
  sendTimeouts.set(sessionId, timer)
}

export function deleteSendTimeout(sessionId: string) {
  sendTimeouts.delete(sessionId)
}

export { SEND_TIMEOUT_MS }

// ============ Runtime 清理 ============

/** 清理 session 的 runtime 及其 requestToSession 映射 */
export function clearRuntime(sessionId: string) {
  useChatStore.setState((state) => {
    const runtime = state.sessionRuntimes[sessionId]
    const { [sessionId]: _, ...restRuntimes } = state.sessionRuntimes
    if (!runtime) return { sessionRuntimes: restRuntimes }
    const { [runtime.requestId]: __, ...restMapping } = state.requestToSession
    return { sessionRuntimes: restRuntimes, requestToSession: restMapping }
  })
}

// ============ Abort 兜底定时器 ============

/** 取消 abort 兜底定时器（abort_result 返回时调用） */
export function clearAbortFallbackTimer(requestId: string) {
  const timer = abortFallbackTimers.get(requestId)
  if (timer) {
    clearTimeout(timer)
    abortFallbackTimers.delete(requestId)
  }
}

export function setAbortFallbackTimer(requestId: string, timer: ReturnType<typeof setTimeout>) {
  abortFallbackTimers.set(requestId, timer)
}

export function deleteAbortFallbackTimer(requestId: string) {
  abortFallbackTimers.delete(requestId)
}

// ============ 技能持久化 ============

export function loadPersistedSkill(): Skill | null {
  try {
    const raw = Taro.getStorageSync(SKILL_STORAGE_KEY)
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  } catch {
    return null
  }
}

export function persistSkill(skill: Skill | null) {
  try {
    if (skill) {
      Taro.setStorageSync(SKILL_STORAGE_KEY, JSON.stringify(skill))
    } else {
      Taro.removeStorageSync(SKILL_STORAGE_KEY)
    }
  } catch {}
}

/** 清除持久化的技能选择（退出登录时调用） */
export function clearSkillStorage() {
  persistSkill(null)
}
