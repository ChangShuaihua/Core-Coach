import Taro from '@tarojs/taro'
import { ws } from '@/services/ws'
import type {
  WsChatSessionCreatedData,
  WsStreamChunkData,
  WsStreamDoneData,
  WsReplyData,
  WsOptionTabsData,
  WsErrorData,
  WsAbortResultData,
  WsReconnectResultData,
  WsSessionEnterResultData,
  WsSessionRoleChangeData,
} from '@/types/ws'
import { WS_ERROR_CODES } from '@/types/ws'
import { clearLastStreamId, markRemoteSessionNeedsReload } from './chat-ws/cleanup'
import { migratePendingSession } from './chat-ws/pendingSession'
import { createRemoteRuntimeForChunk } from './chat-ws/remoteRuntime'
import { findSessionByRequestId, findSourcePending } from './chat-ws/runtimeResolver'
import { enterChatSession } from './chat-ws/sessionHandlers'
import { useChatStore, clearSendTimeout, clearRuntime, clearAbortFallbackTimer } from './chatStore'

// chunk 幂等：记录每个 request 已处理的最大 chunk_index（requestId 维度）
const processedChunkIndex = new Map<string, number>()

// ============ 事件处理注册 ============

let initialized = false

export function initWsHandlers() {
  if (initialized) return
  initialized = true
  const get = useChatStore.getState

  // ---- 新会话创建（主迁移路径：比 stream_chunk 更早到达） ----
  ws.on('chat_session_created', (data: WsChatSessionCreatedData) => {
    const sourcePending = findSourcePending(data.request_id)
    if (!sourcePending) return

    // 更新会话标题（服务端生成的标题比 content.slice 更准确）
    get().updateConversation(sourcePending, { title: data.title || '新对话' })

    // 执行迁移 + session_leave/enter
    migratePendingSession(sourcePending, data.session_id, data.title || '新对话')
  })

  // ---- 流式分片（优先 session_id，兜底 request_id，含首次 chunk 迁移） ----
  ws.on('stream_chunk', (data: WsStreamChunkData) => {
    // 记录 lastStreamId（用于 reconnect 恢复）
    if (data.session_id) {
      get().setLastStreamId(data.session_id, data.stream_id)
    }

    const { sessionRuntimes } = get()

    // 按 session_id 定位 runtime（已迁移过的 session）
    let runtimeKey = sessionRuntimes[data.session_id] ? data.session_id : null

    // 没有找到 → 可能是 pending session 的首次 chunk，需要迁移
    if (!runtimeKey && data.session_id) {
      const sourcePending = findSourcePending(data.request_id)
      if (sourcePending) {
        runtimeKey = sourcePending
        migratePendingSession(sourcePending, data.session_id)
      }
    }

    // 兜底：通过 request_id 查找（非 pending 场景）
    if (!runtimeKey) {
      runtimeKey = findSessionByRequestId(data.request_id) || null
    }

    if (!runtimeKey && data.session_id) {
      if (!createRemoteRuntimeForChunk(data)) return
      runtimeKey = data.session_id
    }

    if (!runtimeKey) return

    // chunk 幂等：按 requestId 维度跳过已处理的 chunk
    const lastIdx = processedChunkIndex.get(data.request_id) ?? -1
    if (data.chunk_index <= lastIdx) return
    processedChunkIndex.set(data.request_id, data.chunk_index)

    clearSendTimeout(runtimeKey)

    const runtime = useChatStore.getState().sessionRuntimes[runtimeKey]
    if (!runtime) return
    const msgSessionId = runtimeKey.startsWith('pending-') ? data.session_id : runtimeKey
    const messages = get().messagesBySession[msgSessionId] || []
    const msg = messages.find((m) => m.id === runtime.assistantMsgId)

    if (!msg) return

    const newContent = msg.content + data.content
    get().updateMessageStatus(msgSessionId, runtime.assistantMsgId, 'streaming', newContent)

    useChatStore.setState((state) => ({
      sessionRuntimes: {
        ...state.sessionRuntimes,
        [msgSessionId]: { ...runtime, status: 'streaming' },
      },
    }))
  })

  // ---- 流式结束（优先 session_id，兜底 request_id，含 pending 迁移兜底） ----
  ws.on('stream_done', (data: WsStreamDoneData) => {
    const { sessionRuntimes } = get()
    const runtimeKey =
      (sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(data.request_id)

    if (!runtimeKey) {
      if (data.session_id) {
        markRemoteSessionNeedsReload(data.session_id)
      }
      return
    }

    clearSendTimeout(runtimeKey)
    processedChunkIndex.delete(data.request_id)

    const runtime = useChatStore.getState().sessionRuntimes[runtimeKey]
    if (!runtime) return
    get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'success', data.content)
    if (data.images?.length) {
      get().updateMessageImages(runtimeKey, runtime.assistantMsgId, data.images)
    }

    // 兜底迁移：stream_chunk 未触发迁移时（如 chunk 阶段 session_id 为空），由 stream_done 兜住
    const sourcePending = findSourcePending(data.request_id)
    if (sourcePending) {
      migratePendingSession(sourcePending, data.session_id, data.content.slice(0, 10) || '新对话')
    }

    clearRuntime(runtimeKey)
    // 清理 lastStreamId
    clearLastStreamId(data.session_id)
    get().clearRemoteStreaming(data.session_id)
    get().clearRemoteDirty(data.session_id)
  })

  // ---- 非流式回复（优先 session_id，兜底 request_id，含 pending 迁移） ----
  ws.on('reply', (data: WsReplyData) => {
    const { sessionRuntimes } = get()
    const runtimeKey =
      (sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(data.request_id)
    if (!runtimeKey) {
      if (data.session_id) {
        markRemoteSessionNeedsReload(data.session_id)
      }
      return
    }

    clearSendTimeout(runtimeKey)
    processedChunkIndex.delete(data.request_id)

    const runtime = useChatStore.getState().sessionRuntimes[runtimeKey]
    if (!runtime) return
    get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'success', data.content)
    if (data.images?.length) {
      get().updateMessageImages(runtimeKey, runtime.assistantMsgId, data.images)
    }

    // 通过 requestId 找到发起请求的 pending session 迁移
    const sourcePending = findSourcePending(data.request_id)
    if (sourcePending) {
      migratePendingSession(sourcePending, data.session_id, data.content.slice(0, 10) || '新对话')
    }

    clearRuntime(runtimeKey)
    clearLastStreamId(data.session_id)
  })

  // ---- 选项推荐回复（无法准确回答时返回 tip + options） ----
  ws.on('option_tabs', (data: WsOptionTabsData) => {
    const { sessionRuntimes } = get()
    const runtimeKey =
      (sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(data.request_id)
    if (!runtimeKey) {
      if (data.session_id) {
        markRemoteSessionNeedsReload(data.session_id)
      }
      return
    }

    clearSendTimeout(runtimeKey)
    processedChunkIndex.delete(data.request_id)

    const runtime = useChatStore.getState().sessionRuntimes[runtimeKey]
    if (!runtime) return
    const content = data.tip || ''
    get().updateMessageStatus(runtimeKey, runtime.assistantMsgId, 'success', content)
    get().updateMessageOptions(runtimeKey, runtime.assistantMsgId, data.options)

    const sourcePending = findSourcePending(data.request_id)
    if (sourcePending) {
      migratePendingSession(sourcePending, data.session_id, content.slice(0, 10) || '新对话')
    }

    clearRuntime(sourcePending ? data.session_id : runtimeKey)
    clearLastStreamId(data.session_id)
  })

  // ---- 错误处理（优先 session_id，兜底 request_id，兜底当前会话，含 pending 迁移） ----
  ws.on('error', (data: WsErrorData) => {
    if (data.code === WS_ERROR_CODES.ROLE) {
      Taro.showToast({ title: data.message || '当前设备无权执行该操作', icon: 'none' })
      return
    }

    if (data.code === WS_ERROR_CODES.SESSION_OCCUPIED && data.session_id) {
      get().setSessionRole(data.session_id, 'viewer')
      Taro.showToast({ title: '该会话正在其他设备使用，仅可浏览', icon: 'none' })
      return
    }

    if (!data.session_id && !data.request_id) {
      console.warn('[WS] ignore unscoped error event', data)
      Taro.showToast({ title: data.message || '请求失败', icon: 'none' })
      return
    }

    const { sessionRuntimes, currentConversationId, messagesBySession } = get()
    const targetSessionId =
      (data.session_id && sessionRuntimes[data.session_id] ? data.session_id : null) ||
      (data.request_id ? findSessionByRequestId(data.request_id) : undefined) ||
      // 兜底：无法匹配 runtime 时，用当前会话
      (currentConversationId && sessionRuntimes[currentConversationId]
        ? currentConversationId
        : null)

    if (targetSessionId) {
      clearSendTimeout(targetSessionId)
      if (data.request_id) processedChunkIndex.delete(data.request_id)

      const runtime = sessionRuntimes[targetSessionId]
      if (runtime) {
        // 终态幂等：如果消息已经是 error 状态，跳过重复处理
        const messages = messagesBySession[targetSessionId] || []
        const msg = messages.find((m) => m.id === runtime.assistantMsgId)
        if (msg?.status === 'error') return

        get().updateMessageStatus(
          targetSessionId,
          runtime.assistantMsgId,
          'error',
          data.message || '发送失败'
        )

        // 通过 requestId 找到发起请求的 pending session 迁移
        if (data.request_id && data.session_id) {
          const sourcePending = findSourcePending(data.request_id)
          if (sourcePending) {
            migratePendingSession(
              sourcePending,
              data.session_id,
              data.message?.slice(0, 10) || '新对话'
            )
          }
        }

        clearRuntime(targetSessionId)
        // 清理 lastStreamId
        clearLastStreamId(data.session_id)
      }
    }

    Taro.showToast({ title: data.message || '请求失败', icon: 'none' })
  })

  // ---- 中断确认（清理 runtime + pending 迁移） ----
  ws.on('abort_result', (data: WsAbortResultData) => {
    const { sessionRuntimes } = get()
    const sourcePending = data.session_id ? findSourcePending(data.request_id) : undefined
    const runtimeKey =
      (data.session_id && sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(data.request_id) ||
      data.session_id

    if (!runtimeKey) return

    clearSendTimeout(runtimeKey)
    if (data.session_id && data.session_id !== runtimeKey) {
      clearSendTimeout(data.session_id)
    }
    processedChunkIndex.delete(data.request_id)
    // 取消 abort 兜底定时器
    clearAbortFallbackTimer(data.request_id)

    // 用服务端返回的消息标记 error
    const sessionsToUpdate = Array.from(
      new Set([runtimeKey, data.session_id].filter(Boolean) as string[])
    )
    sessionsToUpdate.forEach((sessionId) => {
      const messages = get().messagesBySession[sessionId] || []
      messages.forEach((m) => {
        if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
          get().updateMessageStatus(sessionId, m.id, 'error', data.message || '已停止生成')
        }
      })
    })

    // 通过 requestId 找到发起请求的 pending session 迁移
    if (data.session_id && sourcePending) {
      migratePendingSession(sourcePending, data.session_id, data.message?.slice(0, 10) || '新对话')
    }

    clearRuntime(runtimeKey)
    if (data.session_id && data.session_id !== runtimeKey) {
      clearRuntime(data.session_id)
    }
    // 清理 lastStreamId
    clearLastStreamId(data.session_id)
    if (data.session_id) {
      get().clearRemoteStreaming(data.session_id)
      get().clearRemoteDirty(data.session_id)
    }
  })

  // ---- 重连结果（按 session_id 路由，missed_messages 复用已有 handler） ----
  ws.on('reconnect_result', (data: WsReconnectResultData) => {
    if (!data.success) return

    const { sessionRuntimes } = get()
    const sessionId = data.session_id
    const runtime = sessionRuntimes[sessionId]

    // 将 missed_messages 重新注入事件系统
    if (data.missed_messages?.length) {
      ws.reemit(
        data.missed_messages.map((m) => ({
          event_type: m.event_type,
          data: { ...m.data, request_id: m.request_id, session_id: sessionId },
        }))
      )
    }

    // 服务端没有活跃流且本地还有 runtime，清理
    if (!data.has_active_stream && runtime) {
      clearRuntime(sessionId)
      clearLastStreamId(sessionId)
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
    enterChatSession(currentConversationId)
  })

  ws.on('disconnect', () => {
    get().setWsConnected(false)
    processedChunkIndex.clear()
  })
}
