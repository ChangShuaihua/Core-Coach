import Taro from '@tarojs/taro'
import { ws } from '@/services/ws'
import type { Conversation } from '@/types/chat'
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
import { enterChatSession, leaveChatSession } from './chat-ws/sessionHandlers'
import { useChatStore, clearSendTimeout, clearRuntime, clearAbortFallbackTimer } from './chatStore'

// ============ 辅助函数 ============

/** 按 request_id 通过 requestToSession 索引查找 sessionId */
function findSessionByRequestId(requestId: string): string | undefined {
  return useChatStore.getState().requestToSession[requestId]
}

/** 通过 requestId 查找发起请求的 pending session */
function findSourcePending(requestId: string): string | undefined {
  const sessionId = useChatStore.getState().requestToSession[requestId]
  if (sessionId?.startsWith('pending-')) return sessionId
  return undefined
}

/**
 * 执行 pending -> real session 迁移（状态 + 运行时 + 会话通知）
 * - 原子更新：conversations / messagesBySession / sessionRuntimes / requestToSession / currentConversationId
 * - 迁移后发送 session_leave + session_enter，确保用户拿到 chatter 角色
 * - 若 realSession 已存在于 conversations（并发场景），合并而非覆盖
 */
function migratePendingSession(pendingId: string, realSessionId: string, title?: string) {
  const wasViewing = useChatStore.getState().currentConversationId === pendingId

  useChatStore.setState((state) => {
    const { [pendingId]: pendingConv, ...restConvs } = state.conversations
    const { [pendingId]: pendingMsgs, ...restMsgs } = state.messagesBySession

    // 迁移 runtime：pending → real session
    const runtime = state.sessionRuntimes[pendingId]
    let newRuntimes = state.sessionRuntimes
    let newRequestToSession = state.requestToSession
    if (runtime) {
      const { [pendingId]: _, ...restRuntimes } = state.sessionRuntimes
      newRuntimes = { ...restRuntimes, [realSessionId]: runtime }
      const { [runtime.requestId]: __, ...restMapping } = state.requestToSession
      newRequestToSession = { ...restMapping, [runtime.requestId]: realSessionId }
    }

    // realSession 已存在（并发场景：多个 pending 迁移到同一 session）
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

  // 通知后端：先 leave 再 enter，确保拿到 chatter 角色
  leaveChatSession(realSessionId)
  enterChatSession(realSessionId)
}

// chunk 幂等：记录每个 request 已处理的最大 chunk_index（requestId 维度）
const processedChunkIndex = new Map<string, number>()

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

function createRemoteRuntimeForChunk(data: WsStreamChunkData): boolean {
  const sessionId = data.session_id
  const messages = useChatStore.getState().messagesBySession[sessionId] || []
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user')
  const hasUserContext = lastUserIndex >= 0
  if (!hasUserContext || data.chunk_index > 0) {
    markRemoteDirty(sessionId)
    ensureRemotePendingIfLastMessageIsUser(sessionId)
    return false
  }

  const assistantMsgId = `a-${data.request_id}`
  useChatStore.setState((state) => {
    const currentMessages = state.messagesBySession[sessionId] || []
    const lastAssistant = [...currentMessages]
      .reverse()
      .find((m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming'))
    const messageId = lastAssistant?.id || assistantMsgId

    return {
      messagesBySession: lastAssistant
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

    console.log('[chat_session_created]', {
      pendingId: sourcePending,
      realSessionId: data.session_id,
      title: data.title,
    })

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

    console.log('[chunk] 更新消息', {
      runtimeKey,
      msgSessionId,
      assistantMsgId: runtime.assistantMsgId,
      messagesLen: messages.length,
      msgFound: !!msg,
      content: data.content,
      currentConversationId: get().currentConversationId,
    })
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

    console.log('[stream_done]', {
      requestId: data.request_id,
      sessionId: data.session_id,
      runtimeKey,
      currentConversationId: get().currentConversationId,
      contentLen: data.content?.length,
    })
    if (!runtimeKey) {
      if (data.session_id) {
        get().markRemoteDirty(data.session_id)
        get().clearRemoteStreaming(data.session_id)
        if (get().currentConversationId === data.session_id) {
          void get().loadMessages(data.session_id, { force: true })
        }
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
    useChatStore.setState((state) => {
      const { [data.session_id]: _, ...rest } = state.lastStreamIds
      return { lastStreamIds: rest }
    })
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
        get().markRemoteDirty(data.session_id)
        get().clearRemoteStreaming(data.session_id)
        if (get().currentConversationId === data.session_id) {
          void get().loadMessages(data.session_id, { force: true })
        }
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
    useChatStore.setState((state) => {
      const { [data.session_id]: _, ...rest } = state.lastStreamIds
      return { lastStreamIds: rest }
    })
  })

  // ---- 选项推荐回复（无法准确回答时返回 tip + options） ----
  ws.on('option_tabs', (data: WsOptionTabsData) => {
    const { sessionRuntimes } = get()
    const runtimeKey =
      (sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(data.request_id)
    if (!runtimeKey) {
      if (data.session_id) {
        get().markRemoteDirty(data.session_id)
        get().clearRemoteStreaming(data.session_id)
        if (get().currentConversationId === data.session_id) {
          void get().loadMessages(data.session_id, { force: true })
        }
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
    useChatStore.setState((state) => {
      const { [data.session_id]: _, ...rest } = state.lastStreamIds
      return { lastStreamIds: rest }
    })
  })

  // ---- 错误处理（优先 session_id，兜底 request_id，兜底当前会话，含 pending 迁移） ----
  ws.on('error', (data: WsErrorData) => {
    if (data.code === WS_ERROR_CODES.SESSION_OCCUPIED && data.session_id) {
      get().setSessionRole(data.session_id, 'viewer')
      Taro.showToast({ title: '该会话正在其他设备使用，仅可浏览', icon: 'none' })
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
        if (data.session_id) {
          useChatStore.setState((state) => {
            const { [data.session_id!]: _, ...rest } = state.lastStreamIds
            return { lastStreamIds: rest }
          })
        }
      }
    }

    Taro.showToast({ title: data.message || '请求失败', icon: 'none' })
  })

  // ---- 中断确认（清理 runtime + pending 迁移） ----
  ws.on('abort_result', (data: WsAbortResultData) => {
    const { sessionRuntimes } = get()
    const runtimeKey =
      (data.session_id && sessionRuntimes[data.session_id] ? data.session_id : null) ||
      findSessionByRequestId(data.request_id)

    if (!runtimeKey) return

    clearSendTimeout(runtimeKey)
    processedChunkIndex.delete(data.request_id)
    // 取消 abort 兜底定时器
    clearAbortFallbackTimer(data.request_id)

    // 用服务端返回的消息标记 error
    const messages = get().messagesBySession[runtimeKey] || []
    messages.forEach((m) => {
      if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
        get().updateMessageStatus(runtimeKey, m.id, 'error', data.message || '已停止生成')
      }
    })

    // 通过 requestId 找到发起请求的 pending session 迁移
    if (data.session_id) {
      const sourcePending = findSourcePending(data.request_id)
      if (sourcePending) {
        migratePendingSession(
          sourcePending,
          data.session_id,
          data.message?.slice(0, 10) || '新对话'
        )
      }
    }

    clearRuntime(runtimeKey)
    // 清理 lastStreamId
    if (data.session_id) {
      useChatStore.setState((state) => {
        const { [data.session_id!]: _, ...rest } = state.lastStreamIds
        return { lastStreamIds: rest }
      })
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
      useChatStore.setState((state) => {
        const { [sessionId]: _, ...rest } = state.lastStreamIds
        return { lastStreamIds: rest }
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
    enterChatSession(currentConversationId)
  })

  ws.on('disconnect', () => {
    get().setWsConnected(false)
    processedChunkIndex.clear()
  })
}
