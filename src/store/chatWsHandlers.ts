import Taro from '@tarojs/taro'
import { ws } from '@/services/ws'
import { Conversation } from '@/types/chat'
import type {
  WsStreamChunkData,
  WsStreamDoneData,
  WsReplyData,
  WsErrorData,
  WsAbortResultData,
  WsSessionEnterResultData,
  WsSessionRoleChangeData,
} from '@/types/ws'
import { WS_ERROR_CODES } from '@/types/ws'
import { useChatStore, clearSendTimeout } from './chatStore'

// ============ 辅助函数 ============

/** 按 request_id 在所有 runtime 中查找，返回 sessionKey */
function findSessionByRequestId(
  runtimes: Record<string, { requestId: string }>,
  requestId: string
): string | undefined {
  return Object.entries(runtimes).find(([, rt]) => rt.requestId === requestId)?.[0]
}

// chunk 幂等：记录每个 runtime 已处理的最大 chunk_index
const processedChunkIndex = new Map<string, number>()

// ============ 事件处理注册 ============

export function initWsHandlers() {
  const get = useChatStore.getState

  // ---- 流式分片（优先 session_id，兜底 request_id） ----
  ws.on('stream_chunk', (data: WsStreamChunkData) => {
    // 记录 lastStreamId（用于 reconnect 恢复）
    if (data.session_id) {
      get().setLastStreamId(data.session_id, data.stream_id)
    }

    const { sessionRuntimes } = get()
    const runtimeKey =
      (sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(sessionRuntimes, data.request_id)
    if (!runtimeKey) return

    // chunk 幂等：跳过已处理的 chunk
    const lastIdx = processedChunkIndex.get(runtimeKey) ?? -1
    if (data.chunk_index <= lastIdx) return
    processedChunkIndex.set(runtimeKey, data.chunk_index)

    clearSendTimeout(runtimeKey)

    const runtime = sessionRuntimes[runtimeKey]
    const messages = get().messagesBySession[runtimeKey] || []
    const msg = messages.find((m) => m.id === runtime.assistantMsgId)
    if (!msg) return

    const newContent = msg.content + data.content
    get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'streaming', newContent)

    useChatStore.setState((state) => ({
      sessionRuntimes: {
        ...state.sessionRuntimes,
        [runtimeKey]: { ...runtime, status: 'streaming' },
      },
    }))
  })

  // ---- 流式结束（优先 session_id，兜底 request_id，含 pending 迁移） ----
  ws.on('stream_done', (data: WsStreamDoneData) => {
    const { sessionRuntimes, currentConversationId } = get()
    const runtimeKey =
      (sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(sessionRuntimes, data.request_id)
    if (!runtimeKey) return

    clearSendTimeout(runtimeKey)
    processedChunkIndex.delete(runtimeKey)

    const runtime = sessionRuntimes[runtimeKey]
    get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'success', data.content)

    // 新会话：pending -> real session 迁移
    if (currentConversationId?.startsWith('pending-')) {
      useChatStore.setState((state) => {
        const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
        const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession

        const newConv: Conversation = {
          ...(pendingConv as Conversation),
          id: data.session_id,
          title: data.content.slice(0, 10) || '新对话',
        }

        const { [runtimeKey]: _, ...restRuntimes } = state.sessionRuntimes

        return {
          currentConversationId: data.session_id,
          conversations: { [data.session_id]: newConv, ...restConvs },
          messagesBySession: { [data.session_id]: pendingMsgs || [], ...restMsgs },
          sessionRuntimes: restRuntimes,
        }
      })
    } else {
      useChatStore.setState((state) => {
        const { [runtimeKey]: _, ...rest } = state.sessionRuntimes
        return { sessionRuntimes: rest }
      })
    }
  })

  // ---- 非流式回复（优先 session_id，兜底 request_id，含 pending 迁移） ----
  ws.on('reply', (data: WsReplyData) => {
    const { sessionRuntimes, currentConversationId } = get()
    const runtimeKey =
      (sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(sessionRuntimes, data.request_id)
    if (!runtimeKey) return

    clearSendTimeout(runtimeKey)
    processedChunkIndex.delete(runtimeKey)

    const runtime = sessionRuntimes[runtimeKey]
    get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'success', data.content)

    if (currentConversationId?.startsWith('pending-')) {
      useChatStore.setState((state) => {
        const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
        const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession

        const newConv: Conversation = {
          ...(pendingConv as Conversation),
          id: data.session_id,
          title: data.content.slice(0, 10) || '新对话',
        }

        const { [runtimeKey]: _, ...restRuntimes } = state.sessionRuntimes

        return {
          currentConversationId: data.session_id,
          conversations: { [data.session_id]: newConv, ...restConvs },
          messagesBySession: { [data.session_id]: pendingMsgs || [], ...restMsgs },
          sessionRuntimes: restRuntimes,
        }
      })
    } else {
      useChatStore.setState((state) => {
        const { [runtimeKey]: _, ...rest } = state.sessionRuntimes
        return { sessionRuntimes: rest }
      })
    }
  })

  // ---- 错误处理（优先 session_id，兜底 request_id） ----
  ws.on('error', (data: WsErrorData) => {
    if (data.code === WS_ERROR_CODES.SESSION_OCCUPIED && data.session_id) {
      get().setSessionRole(data.session_id, 'viewer')
      Taro.showToast({ title: '该会话正在其他设备使用，仅可浏览', icon: 'none' })
      return
    }

    const { sessionRuntimes } = get()
    const targetSessionId =
      (data.session_id && sessionRuntimes[data.session_id] ? data.session_id : null) ||
      (data.request_id ? findSessionByRequestId(sessionRuntimes, data.request_id) : undefined)

    if (targetSessionId) {
      clearSendTimeout(targetSessionId)
      processedChunkIndex.delete(targetSessionId)
      const runtime = sessionRuntimes[targetSessionId]
      if (runtime) {
        get().updateMessageStatus(
          targetSessionId,
          runtime.assistantMsgId,
          'error',
          data.message || '发送失败'
        )
        useChatStore.setState((state) => {
          const { [targetSessionId]: _, ...rest } = state.sessionRuntimes
          return { sessionRuntimes: rest }
        })
      }
    }

    Taro.showToast({ title: data.message || '请求失败', icon: 'none' })
  })

  // ---- 中断确认（解析 pendingAbort + 清理 runtime） ----
  ws.on('abort_result', (data: WsAbortResultData) => {
    // 解析 pendingAbort（由 stopResponding 注册）
    const { pendingAborts } = get()
    const resolver = pendingAborts.get(data.request_id)
    if (resolver) {
      resolver(data)
      const newMap = new Map(pendingAborts)
      newMap.delete(data.request_id)
      useChatStore.setState({ pendingAborts: newMap })
    }

    // 找 runtime 并清理
    const { sessionRuntimes } = get()
    const runtimeKey =
      (data.session_id && sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(sessionRuntimes, data.request_id)

    if (runtimeKey) {
      clearSendTimeout(runtimeKey)
      processedChunkIndex.delete(runtimeKey)
      const messages = get().messagesBySession[runtimeKey] || []
      messages.forEach((m) => {
        if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
          get().updateMessageStatus(runtimeKey, m.id, 'error', '已停止生成')
        }
      })
      useChatStore.setState((state) => {
        const { [runtimeKey]: _, ...rest } = state.sessionRuntimes
        return { sessionRuntimes: rest }
      })
    }
  })

  // ---- 会话进入确认 ----
  ws.on('session_enter_result', (data: WsSessionEnterResultData) => {
    get().setSessionRole(data.session_id, data.role)
  })

  // ---- 会话角色变更 ----
  ws.on('session_role_change', (data: WsSessionRoleChangeData) => {
    get().setSessionRole(data.session_id, data.new_role)
    if (data.new_role === 'viewer') {
      Taro.showToast({ title: '你的聊天权限已变更为浏览模式', icon: 'none' })
    } else {
      Taro.showToast({ title: '你已恢复聊天权限', icon: 'none' })
    }
  })

  // ---- 连接状态（重连后重新进入当前会话） ----
  ws.on('connected', () => {
    get().setWsConnected(true)
    const { currentConversationId } = get()
    if (currentConversationId && !currentConversationId.startsWith('pending-')) {
      ws.send('session_enter', {
        session_id: currentConversationId,
        create_time: Math.floor(Date.now() / 1000),
      })
    }
  })

  ws.on('disconnect', () => {
    get().setWsConnected(false)
  })
}
