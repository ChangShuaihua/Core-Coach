# WebSocket 流式聊天 — 完整架构与代码详解

> 写给没有接触过 WebSocket 的开发者。本文假设你懂 React + TypeScript 基础，但不需要了解 WebSocket。

---

## 一、整体架构：一张图看懂数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                         app.tsx (应用级)                         │
│  切后台 → ws.disconnect()    切前台 → refreshToken + ws.connect()│
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  src/services/ws.ts (WebSocket 管理器)             │
│  职责：连接/断连/心跳/重连/消息收发/事件分发                         │
│  导出：ws 单例，全局只有一个实例                                    │
│                                                                   │
│  ws://192.168.10.7:8083/api/v1/ws/connect                        │
│                                                                   │
│  内部事件系统：                                                    │
│    ws.on('stream_chunk', callback)   ← 注册监听                    │
│    ws.emit('stream_chunk', data)     ← 收到消息时分发               │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              src/store/chatStore.ts (Zustand 状态管理)             │
│  职责：桥接 ws 事件 ↔ UI 状态                                      │
│                                                                   │
│  initWsHandlers() 注册 8 个事件监听 → 更新 messagesBySession       │
│  sendMessage() 创建乐观消息 → ws.sendChat()                       │
│  stopResponding() → ws.sendAbort()                                │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              src/pages/chat/index.tsx (聊天页面 UI)                │
│  职责：纯展示，所有状态从 useChatStore 读取                         │
│  组件：WelcomeScreen / MessageList / MessageBubble / ChatInput    │
└──────────────────────────────────────────────────────────────────┘
```

**核心思想：** UI 层不直接操作 WebSocket，而是通过 Zustand store 间接操作。WebSocket 收到的消息也不直接更新 UI，而是先经过 store 处理成 Message 对象，UI 再响应式渲染。

---

## 二、为什么这样设计？（架构决策）

### 2.1 为什么用单例？

```typescript
// src/services/ws.ts 最后一行
export const ws = new WsManager()
```

整个应用只需要**一个** WebSocket 连接。如果每个页面都 new 一个，会建立多个 TCP 连接，浪费资源且无法保持状态一致性。单例保证了：
- 全局只有一个连接
- 切换页面不会断开（状态保持在内存中）
- 所有页面共享同一个事件系统

### 2.2 为什么用"乐观更新"？

```typescript
// chatStore.ts sendMessage() 中，消息还没发出去，就已经加到 messagesBySession 了
get().appendMessage(targetSessionId, userMsg)  // 先显示用户消息
get().appendMessage(targetSessionId, aiMsg)    // 先显示 AI 占位（pending 状态）
// 然后才通过 ws 发送
ws.sendChat({ ... })
```

这叫**乐观更新（Optimistic Update）**——先假设请求会成功，立即更新 UI，不等服务端响应。好处是用户体验丝滑：用户点发送后立刻看到自己的消息和 AI 的"正在输入..."，不需要等待网络往返。

### 2.3 为什么用 request_id 做映射？

```typescript
// 发消息时建立映射
requestToAssistantMsg[requestId] = { sessionId, msgId }

// 收到服务端回复时，通过 request_id 找到对应的 AI 消息
const mapping = requestToAssistantMsg[data.request_id]
```

WebSocket 是全双工的，可能同时发多条消息。如果没有 `request_id`，收到 `stream_chunk` 时无法知道这个分片属于哪条 AI 消息。这个映射表就是一个"请求-消息"的对应关系。

### 2.4 为什么用 pending-xxx 做临时会话 ID？

新对话在没有发送前，服务端还没有分配 `session_id`。前端先用 `pending-{时间戳}` 作为临时 ID，等 AI 首次回复后，用服务端返回的真实 `session_id` 替换。

---

## 三、逐文件详解

---

### 文件 1：`src/types/ws.ts` — WebSocket 类型定义（协议的 TypeScript 翻译）

这是整个 WebSocket 协议的类型声明文件。它把 `websocket2.md` 中描述的 JSON 协议翻译成了 TypeScript 类型，让代码有类型安全。

#### 3.1.1 事件类型枚举

```typescript
export type WsEventType =
  | 'auth'           // 客户端→服务端：认证
  | 'connected'      // 服务端→客户端：认证成功
  | 'auth_failed'    // 服务端→客户端：认证失败
  | 'ping'           // 客户端→服务端：心跳
  | 'pong'           // 服务端→客户端：心跳响应
  | 'chat'           // 客户端→服务端：发消息
  | 'reply'          // 服务端→客户端：非流式完整回复
  | 'stream_chunk'   // 服务端→客户端：流式分片
  | 'stream_done'    // 服务端→客户端：流式结束
  | 'error'          // 服务端→客户端：错误
  | 'session_switch' // 客户端→服务端：切换会话
  | 'session_released' // 服务端→客户端：会话释放
  | 'abort'          // 客户端→服务端：中断生成
  | 'abort_result'   // 服务端→客户端：中断确认
  | 'reconnect'      // 客户端→服务端：重连
  | 'reconnect_result' // 服务端→客户端：重连结果
  | 'disconnect'     // 客户端→服务端：主动断开
```

这是一个 TypeScript **联合类型（Union Type）**。它的作用是限制 `event_type` 的值只能是这 17 个字符串之一，打错字会直接报编译错误。

#### 3.1.2 通用消息包装

```typescript
export interface WsMessage<T = any> {
  event_type: WsEventType  // 事件类型（决定 data 是什么结构）
  data: T                  // 泛型，根据 event_type 不同而不同
}
```

这是所有 WebSocket 消息的**外层信封**。每条消息都是 `{ event_type, data }` 的结构。`<T = any>` 是 TypeScript 泛型，意思是 `data` 的类型取决于具体场景。比如：
- `WsMessage<WsChatData>` → `data` 的类型是 `WsChatData`
- `WsMessage<WsStreamChunkData>` → `data` 的类型是 `WsStreamChunkData`

#### 3.1.3 客户端→服务端数据包

| 接口 | 对应事件 | 字段 | 说明 |
|------|----------|------|------|
| `WsAuthData` | `auth` | `user_id`, `token` | 连接后第一条消息，告诉服务端"我是谁" |
| `WsChatData` | `chat` | `output_type`, `request_id`, `session_id`, `content`, `workflow_id?`, `create_time` | 发送聊天消息 |
| `WsSessionSwitchData` | `session_switch` | `request_id`, `old_session_id`, `new_session_id`, `switch_reason`, `create_time` | 切换当前消费的 Redis Stream |
| `WsAbortData` | `abort` | `request_id`, `session_id`, `reason`, `create_time` | 中断当前 AI 生成 |
| `WsReconnectData` | `reconnect` | `request_id`, `user_id`, `token`, `last_stream_id`, `session_id` | 断网后重连，补推遗漏消息 |
| `WsDisconnectData` | `disconnect` | `session_id`, `reason`, `create_time` | 客户端主动断开 |
| `WsPingData` | `ping` | `timestamp`, `session_id` | 心跳检测 |

#### 3.1.4 服务端→客户端数据包

| 接口 | 对应事件 | 字段 | 说明 |
|------|----------|------|------|
| `WsConnectedData` | `connected` | `content` | 认证成功确认 |
| `WsAuthFailedData` | `auth_failed` | `code`, `message`, `retry_after?` | 认证失败及原因 |
| `WsPongData` | `pong` | `timestamp`, `server_time`, `connection_status` | 心跳响应 |
| `WsReplyData` | `reply` | `output_type`, `request_id`, `session_id`, `content`, `create_time`, `finished` | 非流式完整回复 |
| `WsStreamChunkData` | `stream_chunk` | `output_type`, `request_id`, `session_id`, `stream_id`, `chunk_index`, `content`, `create_time`, `finished` | 流式分片（逐 token 推送） |
| `WsStreamDoneData` | `stream_done` | `output_type`, `request_id`, `session_id`, `total_chunks`, `content`, `create_time`, `finished` | 流式结束，content 是完整拼接结果 |
| `WsErrorData` | `error` | `code`, `http_code?`, `message`, `request_id?`, `session_id?`, `recoverable`, `suggested_action?`, `create_time` | 错误通知 |
| `WsAbortResultData` | `abort_result` | `request_id`, `session_id`, `success`, `stopped_at_chunk`, `message`, `create_time` | 中断确认 |
| `WsReconnectResultData` | `reconnect_result` | `request_id`, `success`, `has_active_stream`, `missed_messages`, `create_time` | 重连结果，含遗漏消息 |
| `WsSessionReleasedData` | `session_released` | `session_id`, `message`, `create_time` | 会话占用解除 |

---

### 3.1.5 每个数据包字段详细解释

#### `WsChatData`（chat — 发送消息）

```
{
  output_type: 'stream' | 'sync',  // 'stream'=流式逐字输出, 'sync'=等完整结果再返回
  request_id: string,              // 前端生成的唯一请求ID，用于匹配请求和回复
  session_id: string,              // 会话ID，空字符串=新会话，服务端自动创建
  content: string,                 // 用户输入的文本
  workflow_id?: string,            // Coze 工作流ID，不传则用默认工作流
  create_time: number              // Unix 秒级时间戳
}
```

**为什么 `session_id` 可以为空？** 新对话没有 session_id，服务端收到空字符串时自动创建新会话，并在第一条回复中返回新 ID。前端用 `pending-xxx` 临时占位，收到 `stream_done` 后替换。

**为什么 `output_type` 要区分 stream/sync？** 有些场景（如简单问答）不需要流式输出，直接等完整结果更简单。但本项目的聊天页统一用 `stream`。

#### `WsStreamChunkData`（stream_chunk — 流式分片）

```
{
  output_type: 'stream',   // 固定为 'stream'
  request_id: string,      // 对应原始请求的 request_id，前端用它找到对应消息
  session_id: string,      // 会话ID
  stream_id: string,       // Redis Stream 自动分配的ID，如 "1716638400123-0"
  chunk_index: number,     // 分片序号，从 0 开始递增
  content: string,         // 本次分片的文本片段（不是累计内容，是增量）
  create_time: number,     // Unix 秒级时间戳
  finished: false          // 固定为 false，表示流未结束
}
```

**注意：`content` 是增量，不是全量。** 前端需要自行拼接：`当前消息内容 + data.content`。

**为什么需要 `chunk_index`？** 用于检测丢包和乱序。如果收到的 chunk_index 不连续，说明有分片丢失。

**为什么需要 `stream_id`？** 这是 Redis Stream 的内部 ID，断网重连时用 `last_stream_id` 告诉服务端"我收到这条了，从下一条开始补推"。

#### `WsStreamDoneData`（stream_done — 流式结束）

```
{
  output_type: 'stream',
  request_id: string,
  session_id: string,
  total_chunks: number,    // 总分片数（可用于校验前端拼接的分片数是否一致）
  content: string,         // 服务端拼接好的完整回复（前端直接用，无需自己拼接）
  create_time: number,
  finished: true           // 固定为 true
}
```

**为什么服务端要发完整 content？** 防止前端拼接出错（比如丢包导致内容不完整），同时也方便直接用于持久化和展示。

#### `WsReplyData`（reply — 非流式回复）

```
{
  output_type: 'sync',     // 固定为 'sync'（非流式）
  request_id: string,
  session_id: string,
  content: string,         // 完整的AI回复
  create_time: number,
  finished: true
}
```

和 `stream_done` 类似，但 `output_type` 不同。本项目实际使用中聊天页统一走流式，此类型作为兼容保留。

#### `WsAbortData`（abort — 中断生成）

```
{
  request_id: string,      // 要中断的请求ID
  session_id: string,      // 会话ID
  reason: 'user_cancelled', // 中断原因
  create_time: number
}
```

用户点击停止按钮时发送。服务端收到后取消 Coze API 调用，将未推送的分片标记为 `cancelled`。

#### `WsAbortResultData`（abort_result — 中断确认）

```
{
  request_id: string,
  session_id: string,
  success: boolean,        // 是否中断成功
  stopped_at_chunk: number, // 在第几个分片处停止
  message: string,         // 如 "消息发送已中断"
  create_time: number
}
```

服务端对 `abort` 的确认。前端收到后标记所有 pending/streaming 消息为 `error`。

#### `WsReconnectData`（reconnect — 重连请求）

```
{
  request_id: string,          // 重连请求的唯一标识
  user_id: string,             // 用户ID
  token: string,               // JWT token（服务端验证身份）
  last_stream_id: string,      // 断网前最后收到的 stream_id，服务端从此ID之后开始补推
  session_id: string           // 要恢复的会话ID
}
```

**`last_stream_id` 是最关键的字段。** 它让服务端知道客户端收到了哪些分片，从断点续传。

#### `WsReconnectResultData`（reconnect_result — 重连结果）

```
{
  request_id: string,
  success: boolean,
  has_active_stream: boolean,        // true=Coze 还在生成中，补推完继续实时推送
  missed_messages: WsMessage[],      // 遗漏的消息数组（按时间升序）
  create_time: number
}
```

**`has_active_stream` 的含义：** 断网期间如果 AI 生成还没结束，服务端先补推遗漏分片，然后继续实时推送新分片。

#### `WsErrorData`（error — 错误通知）

```
{
  code: string,              // 错误码，如 'WS_ERR_SESSION_OCCUPIED'
  http_code?: number,        // 对应的 HTTP 状态码
  message: string,           // 人类可读的错误信息
  request_id?: string,       // 可选，关联到具体请求
  session_id?: string,       // 可选，关联到具体会话
  recoverable: boolean,      // 是否可恢复（true=可以重试）
  suggested_action?: string, // 建议操作，如 'retry'
  create_time: number
}
```

**`request_id` 是可选的**，因为有些错误和具体请求无关（比如 `SESSION_OCCUPIED` 是会话级别的）。

#### `WsSessionSwitchData`（session_switch — 切换会话）

```
{
  request_id: string,
  old_session_id: string,    // 之前消费的会话
  new_session_id: string,    // 要切换到的新会话
  switch_reason: 'user_initiated',
  create_time: number
}
```

**切换会话只是改变 Redis Stream 的消费目标，不触发 AI 调用。**

#### `WsPingData` / `WsPongData`（心跳）

```
ping: { timestamp, session_id }
pong: { timestamp, server_time, connection_status }
```

每 30 秒发一次 ping，服务端 90 秒没收到任何消息就断连。pong 中的 `server_time` 可用于校准客户端时间。

#### `WsDisconnectData`（disconnect — 主动断开）

```
{
  session_id: string,
  reason: string,       // 如 'user_leaving'
  create_time: number
}
```

客户端主动断开时发送，服务端收到后清理 Consumer Group 中的 pending 消息。

---

### 文件 2：`src/types/chat.ts` — 聊天业务类型（UI 层的数据结构）

```typescript
export type MessageStatus = 'pending' | 'streaming' | 'success' | 'error'
```

这是消息在前端展示的 4 种状态，完全不同于 WebSocket 事件类型，是**UI 层**的概念：

| 状态 | 含义 | 触发时机 | Bubble 表现 |
|------|------|----------|-------------|
| `pending` | 等待中，还没收到第一个分片 | `sendMessage()` 创建 AI 消息时 | 显示"正在输入..." |
| `streaming` | 正在逐字输出 | 收到第一个 `stream_chunk` | 显示内容 + 闪烁光标`▍` |
| `success` | 输出完成 | 收到 `stream_done` 或 `reply` | 显示完整内容 |
| `error` | 出错或中断 | 收到 `error` 或 `abort_result` 或用户点停止 | 显示红色边框 + 错误信息 |

```typescript
export interface Message {
  id: string          // 客户端生成，如 'u-1716638400'（用户）、'a-1716638400'（AI）
  role: MessageRole   // 'user' | 'assistant' | 'system'
  content: string     // 消息文本
  timestamp: number   // 毫秒时间戳
  status: MessageStatus // 当前状态
}
```

**为什么 `id` 是客户端生成的？** 因为乐观更新：消息在发送前就需要一个 ID 来标识。用时间戳加前缀保证唯一性。

```typescript
export interface Conversation {
  id: string           // 服务端分配的真实ID，或 'pending-xxx'（临时）
  title: string        // 会话标题（取第一条用户消息的前20字）
  updatedAt: number    // 最后更新时间
  messageCount: number
}
```

```typescript
export interface Skill {
  id: string           // 技能ID
  workflowId: string   // 对应的 Coze 工作流ID
  title: string        // 技能名称
  prompt: string       // 预设提示词
  description?: string
}
```

---

### 文件 3：`src/services/ws.ts` — WebSocket 管理器（核心引擎）

这是整个流式聊天最核心的文件，管理 WebSocket 连接的全生命周期。

#### 3.3.1 类结构概览

```typescript
class WsManager {
  private socketTask: Taro.SocketTask | null  // 微信小程序的 WebSocket 实例
  private _state: WsConnectionState           // 连接状态机
  private listeners: Map<WsEventType, Set<EventHandler>>  // 事件监听器表
  private pingTimer: NodeJS.Timeout | null    // 心跳定时器
  private reconnectTimer: NodeJS.Timeout | null // 重连定时器
  private reconnectAttempts: number           // 重连次数
  private currentSessionId: string            // 当前会话ID
  private lastStreamId: string                // 最后收到的 stream_id（用于重连）
  private pendingAborts: Map<string, { resolve, reject, timer }>  // 等待中的中断请求
}
```

#### 3.3.2 连接状态机

```
disconnected ──connect()──→ connecting ──onOpen──→ connected ──收到'connected'事件──→ authenticated
    ↑                            ↓                      ↓
    └──────────── onError/onClose ──────────────────────┘
```

为什么要分 `connected` 和 `authenticated`？`connected` 只代表 TCP 连接建立成功，此时还不能收发业务消息。`authenticated` 代表服务端已验证 token，可以正常通信。

#### 3.3.3 connect() — 建立连接

```typescript
connect(token: string, userId: string): void {
  // 1. 如果已连接，先断开旧的
  if (this.socketTask) this.disconnect()

  // 2. 更新状态
  this._state = 'connecting'

  // 3. 建立 WebSocket 连接
  this.socketTask = Taro.connectSocket({ url: 'ws://192.168.10.7:8083/api/v1/ws/connect' })

  // 4. 注册回调（注意：必须在 connectSocket 后立即注册，否则可能错过事件）
  this.socketTask.onOpen(() => {
    this._state = 'connected'
    this.send('auth', { user_id: userId, token })  // 连接后第一件事：认证
  })

  this.socketTask.onMessage((res) => {
    this.handleMessage(res.data)  // 所有收到的消息都走这里
  })

  this.socketTask.onClose(() => {
    this.handleDisconnect()  // 统一处理断连逻辑
  })

  this.socketTask.onError(() => {
    this.handleDisconnect()
  })
}
```

**关键细节：** 在 `onOpen` 回调中立即发送 `auth` 消息。这是 WebSocket 认证的标准模式——先建立 TCP 连接，再通过业务消息认证。

#### 3.3.4 handleMessage() — 消息解析与分发

```typescript
private handleMessage(raw: string): void {
  const msg: WsMessage = JSON.parse(raw)  // 解析 JSON
  this.emit(msg.event_type, msg.data)      // 分发给监听器

  // 某些事件类型需要先做内部处理
  switch (msg.event_type) {
    case 'connected':
      this._state = 'authenticated'       // 认证成功
      this.startHeartbeat()               // 开始心跳
      this.reconnectAttempts = 0          // 重置重连计数
      break
    case 'pong':
      // 收到 pong → 连接正常
      break
    case 'stream_chunk':
      this.lastStreamId = msg.data.stream_id  // 记录最后收到的流ID，用于断网重连
      break
    case 'abort_result':
      // 收到中断确认 → resolve 对应的 Promise
      const pending = this.pendingAborts.get(msg.data.request_id)
      if (pending) {
        clearTimeout(pending.timer)
        pending.resolve()
        this.pendingAborts.delete(msg.data.request_id)
      }
      break
  }
}
```

**为什么 `stream_chunk` 要额外记录 `lastStreamId`？** 这是给重连用的。断网后重连时，发送 `last_stream_id` 告诉服务端"最后收到的分片 ID"，服务端就能从这个位置继续推送。

#### 3.3.5 心跳机制

```typescript
private startHeartbeat(): void {
  this.pingTimer = setInterval(() => {
    this.send('ping', { timestamp: Date.now(), session_id: this.currentSessionId })
  }, 30000)  // 每 30 秒发一次 ping
}
```

服务端超过 90 秒没收到任何消息就断开连接。心跳就是"我还活着"的信号，防止空闲断连。

#### 3.3.6 断网重连（指数退避）

```typescript
private handleDisconnect(): void {
  this.stopHeartbeat()
  this._state = 'disconnected'
  this.emit('disconnect', {})

  // 调度重连：等待时间 = min(1s * 2^尝试次数, 30s)
  const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
  this.reconnectTimer = setTimeout(() => this.reconnect(), delay)
}

private sendReconnect(): void {
  this.send('reconnect', {
    request_id: this.generateRequestId(),
    user_id: '',
    token: accessToken,
    last_stream_id: this.lastStreamId,  // ← 关键：告诉服务端从哪补推
    session_id: this.currentSessionId,
  })
}
```

**指数退避**：第 1 次重连等 1s，第 2 次等 2s，第 3 次等 4s...最多等 30s。这样在网络恢复前不会频繁重试，避免浪费资源。

#### 3.3.7 事件系统（pub/sub 模式）

```typescript
private listeners: Map<WsEventType, Set<EventHandler>> = new Map()

on(event: WsEventType, handler: EventHandler): void {
  if (!this.listeners.has(event)) this.listeners.set(event, new Set())
  this.listeners.get(event)!.add(handler)
}

emit(event: WsEventType, data: any): void {
  this.listeners.get(event)?.forEach((handler) => handler(data))
}

off(event: WsEventType, handler: EventHandler): void {
  this.listeners.get(event)?.delete(handler)
}
```

这是一个经典的**发布-订阅（pub/sub）模式**。`on` 注册监听器，`emit` 触发所有监听器。好处是解耦：`WsManager` 不知道谁在监听，监听者也不需要知道消息是怎么收到的。

#### 3.3.8 公共 API 方法

```typescript
// 发送聊天消息
sendChat(data: WsChatData): void {
  this.send('chat', data)
}

// 切换会话（改变 Redis Stream 消费目标）
switchSession(oldId: string, newId: string): void {
  this.send('session_switch', {
    request_id: this.generateRequestId(),
    old_session_id: oldId,
    new_session_id: newId,
    switch_reason: 'user_initiated',
    create_time: Math.floor(Date.now() / 1000),
  })
}

// 中断生成（返回 Promise，5s 超时兜底）
sendAbort(sessionId: string, requestId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(), 5000)  // 5s 超时自动 resolve
    this.pendingAborts.set(requestId, { resolve, reject, timer })
    this.send('abort', {
      request_id: requestId,
      session_id: sessionId,
      reason: 'user_cancelled',
      create_time: Math.floor(Date.now() / 1000),
    })
  })
}
```

**`sendAbort` 为什么返回 Promise 且 5s 超时？** 因为用户点了停止后，希望尽快看到停止效果。如果等服务端确认可能太慢。所以前端先乐观标记为"已停止"，同时等 `abort_result`，5 秒还没收到就当成功了。

```typescript
generateRequestId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
// 示例输出：r_1716638400123_a8x3k2
```

---

### 文件 4：`src/store/chatStore.ts` — 状态管理中心（大脑）

这是连接 WebSocket 和 UI 的核心桥梁。用 Zustand 做状态管理。

#### 3.4.1 Zustand 简介

Zustand 是一个轻量级状态管理库。和 Redux 不同，它不需要 Provider 包裹，不需要 action type 常量。本质上就是一个带了 `set` 和 `get` 方法的 hook。

```typescript
// 创建 store
export const useChatStore = create<ChatStore>()((set, get) => ({ ... }))

// 组件中使用
const messages = useChatStore((s) => s.messagesBySession)
const sendMessage = useChatStore((s) => s.sendMessage)
```

#### 3.4.2 核心 State 解释

| 字段 | 类型 | 用途 |
|------|------|------|
| `conversations` | `Record<string, Conversation>` | 所有会话，key=sessionId |
| `messagesBySession` | `Record<string, Message[]>` | 每个会话的消息列表 |
| `currentConversationId` | `string \| null` | 当前显示的会话 |
| `skills` | `Skill[]` | 可用技能列表 |
| `selectedSkill` | `Skill \| null` | 当前选中技能（持久化到本地存储） |
| `messageCursor` | `string \| null` | 分页游标（加载更多历史消息） |
| `wsConnected` | `boolean` | WebSocket 是否已连接 |
| `sessionOccupied` | `Record<string, boolean>` | 哪些会话被其他设备占用 |
| `activeRequestId` | `string \| null` | 当前正在生成的请求 ID |
| `requestToAssistantMsg` | `Record<string, {sessionId, msgId}>` | **核心映射表** |

#### 3.4.3 sendMessage() — 发送消息的完整流程

```typescript
sendMessage: async (content: string) => {
  // Step 1: 获取当前状态
  const { currentConversationId, selectedSkill, sessionOccupied } = get()
  const workflowId = selectedSkill?.workflowId || DEFAULT_WORKFLOW_ID
  const isNewConversation = !currentConversationId || currentConversationId.startsWith('pending-')

  // Step 2: 检查会话是否被其他设备占用
  if (currentConversationId && sessionOccupied[currentConversationId]) {
    Taro.showToast({ title: '该会话正在其他设备使用中', icon: 'none' })
    return  // ← 直接 return，不允许发送
  }

  // Step 3: 创建乐观消息（先假设成功，立即展示）
  const userMsg: Message = {
    id: 'u-' + Date.now(),  // ← 客户端生成 ID
    role: 'user',
    content,
    timestamp: Date.now(),
    status: 'success',       // ← 用户消息直接标记为成功
  }
  const aiMsg: Message = {
    id: 'a-' + Date.now(),
    role: 'assistant',
    content: '',             // ← 空内容，等 stream_chunk 填充
    timestamp: Date.now(),
    status: 'pending',       // ← 等待中
  }

  // Step 4: 立即写入 store（乐观更新）
  const targetSessionId = currentConversationId || 'pending-' + Date.now()
  get().appendMessage(targetSessionId, userMsg)  // 先加用户消息
  get().appendMessage(targetSessionId, aiMsg)     // 再加 AI 占位

  // Step 5: 建立 request_id → AI消息 的映射
  const requestId = ws.generateRequestId()
  set({
    activeRequestId: requestId,
    requestToAssistantMsg: {
      ...get().requestToAssistantMsg,
      [requestId]: { sessionId: targetSessionId, msgId: aiMsg.id },
    },
  })

  // Step 6: 通过 WebSocket 发送
  ws.sendChat({
    output_type: 'stream',
    request_id: requestId,
    session_id: isNewConversation ? '' : currentConversationId!,  // 新会话传空
    content,
    workflow_id: workflowId,
    create_time: Math.floor(Date.now() / 1000),  // 秒级时间戳
  })
}
```

**关键设计点：**

1. **乐观更新**：消息在发送前就写入 store，用户立刻看到消息出现在屏幕上。
2. **request_id 映射**：`requestToAssistantMsg[requestId]` 存储了这条请求对应的 sessionId 和 msgId。收到服务端回复时，通过这个映射找到要更新哪条消息。
3. **新会话处理**：`session_id: ''` 告诉服务端"这是新会话，帮我创建一个"。服务端在第一次回复中返回真实的 session_id。

#### 3.4.4 initWsHandlers() — 注册 WebSocket 事件处理

这是整个流式聊天的**灵魂**。在 ChatPage 挂载时调用一次，注册 8 个事件监听器。

##### 监听器 1：stream_chunk（流式分片）

```typescript
ws.on('stream_chunk', (data: WsStreamChunkData) => {
  // 1. 通过 request_id 找到对应的消息
  const mapping = requestToAssistantMsg[data.request_id]
  if (!mapping) return  // 找不到？可能是其他设备的请求，忽略

  // 2. 取出当前消息内容
  const msg = messages.find((m) => m.id === mapping.msgId)

  // 3. 追加新内容（content 是增量，不是全量！）
  const newContent = msg.content + data.content

  // 4. 更新状态为 streaming（触发 UI 重渲染）
  updateMessageStatus(sessionId, msgId, 'streaming', newContent)
})
```

**为什么用追加而不是覆盖？** 因为每个 `stream_chunk` 只带一小段文本（通常几个字），需要累积拼接。

**第一次收到 stream_chunk 时**，消息状态从 `pending` 变成 `streaming`。MessageBubble 组件检测到这个变化，从显示"正在输入..."切换到显示内容+闪烁光标。

##### 监听器 2：stream_done（流式结束）

```typescript
ws.on('stream_done', (data: WsStreamDoneData) => {
  const mapping = requestToAssistantMsg[data.request_id]
  if (!mapping) return

  // 用服务端拼接好的完整内容替换（更可靠）
  updateMessageStatus(sessionId, msgId, 'success', data.content)

  // 新会话：把 pending-xxx 替换为真实 session_id
  if (currentConversationId?.startsWith('pending-')) {
    // 1. 从 conversations 中删除 pending-xxx
    // 2. 用 data.session_id 作为新 key 重新插入
    // 3. 从 messagesBySession 中做同样的迁移
    // 4. 更新 currentConversationId
    ws.setCurrentSession(data.session_id)  // 告诉 ws 管理器当前会话变了
  }

  // 清理映射表
  delete requestToAssistantMsg[data.request_id]
  activeRequestId = null
})
```

**为什么用服务端的完整 content 替换前端拼接的？** 防止前端拼接时因丢包导致内容不完整。服务端发的 content 是最终版。

**新会话的 ID 迁移**是最复杂的部分：先删掉临时 key `pending-xxx`，再用真实 ID 重建。Zustand 的不可变更新要求创建新对象而非修改旧对象。

##### 监听器 3：reply（非流式回复）

逻辑和 `stream_done` 基本一样，只是 `output_type` 不同，用于兼容非流式场景。

##### 监听器 4：error（错误处理）

```typescript
ws.on('error', (data: WsErrorData) => {
  // 特殊处理：会话被占用
  if (data.code === WS_ERROR_CODES.SESSION_OCCUPIED && data.session_id) {
    setSessionOccupied(data.session_id, true)  // 标记为占用
    Taro.showToast({ title: '该会话正在其他设备使用，仅可浏览' })
    return
  }

  // 一般错误：标记对应消息为失败
  if (data.request_id) {
    const mapping = requestToAssistantMsg[data.request_id]
    if (mapping) {
      updateMessageStatus(mapping.sessionId, mapping.msgId, 'error', data.message || '发送失败')
      // 清理映射
    }
  }
})
```

##### 监听器 5：abort_result（中断确认）

```typescript
ws.on('abort_result', (data: WsAbortResultData) => {
  // 遍历该会话的所有消息，把 pending/streaming 状态的全标记为 error
  messages.forEach((m) => {
    if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
      updateMessageStatus(data.session_id, m.id, 'error', '已停止生成')
    }
  })
  // 清理映射
})
```

##### 监听器 6-8：连接状态与会话释放

```typescript
ws.on('session_released', (data) => { setSessionOccupied(data.session_id, false) })
ws.on('connected', () => { setWsConnected(true) })
ws.on('disconnect', () => { setWsConnected(false) })
```

#### 3.4.5 stopResponding() — 用户点击停止

```typescript
stopResponding: () => {
  if (!activeRequestId || !currentConversationId) return

  // 1. 通过 WebSocket 发送中断请求
  ws.sendAbort(currentConversationId, activeRequestId)

  // 2. 乐观标记所有 pending/streaming 消息为已停止（不等服务端确认）
  messages.forEach((m) => {
    if (m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')) {
      updateMessageStatus(currentConversationId, m.id, 'error', '已停止生成')
    }
  })

  activeRequestId = null
}
```

**乐观停止**：和乐观发送同样的思路——先改 UI，再等服务端确认。用户点停止后立即看到"已停止生成"，不会感觉卡顿。

#### 3.4.6 其他重要方法

**loadConversations()** — 从 HTTP API 拉取会话列表，与本地已有的合并（保留本地 `pending-xxx` 和本地更新的标题）。

**switchConversation(id)** — 切换显示的会话。先通过 WS 发送 `session_switch`，再更新 `currentConversationId`，最后通过 HTTP 拉取历史消息。

**loadMoreMessages()** — 上滑加载更多历史消息（光标分页，老消息插到数组前面）。

---

### 文件 5：`src/pages/chat/index.tsx` — 聊天页面（UI 层）

```typescript
// 判断是否正在回复：存在 pending 或 streaming 状态的 AI 消息
const isResponding = messages.some(
  (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
)

// 判断是否被占用
const isOccupied = currentConversationId ? !!sessionOccupied[currentConversationId] : false
```

这两个计算属性驱动了 UI 的关键行为：
- `isResponding` → 发送按钮变停止按钮
- `isOccupied` → 输入框禁用 + 显示黄色警告条

```typescript
// 初始化：注册 ws 事件处理（只执行一次）
useEffect(() => { initWsHandlers() }, [])

// 加载数据
useEffect(() => {
  loadConversations().then(() => ensurePendingConversation())
  loadSkills()
}, [])
```

**为什么 `initWsHandlers` 只执行一次？** 事件监听是全局的，注册多次会导致重复处理。而且 `ws.on` 是往 `ws` 单例上注册，和组件生命周期无关。

```typescript
const handleSend = useCallback(async (content: string) => {
  if (isResponding) return           // 正在回复时不允许发新消息
  sendingRef.current = true          // 标记发送中，阻止 loadMessages 覆盖乐观消息
  setScrollToBottomTrigger(prev => prev + 1)  // 触发滚动到底部
  await sendMessage(content)
  sendingRef.current = false
}, [isResponding, sendMessage])
```

**`sendingRef` 的作用：** `switchConversation` 切换会话时会触发 `loadMessages`，如果发送消息的同时触发加载，HTTP 返回的历史消息会覆盖掉乐观消息。用 `sendingRef` 加锁防止这个问题。

---

### 文件 6：`src/pages/chat/components/MessageBubble.tsx` — 消息气泡

这是消息的 4 种视觉状态：

```typescript
// pending：AI 消息还没收到任何内容
{!isUser && message.status === 'pending' && (
  <Text style={{ color: '#9ca3af' }}>正在输入...</Text>
)}

// streaming：AI 正在逐字输出，末尾加闪烁光标
{!isUser && message.status === 'streaming' && (
  <Text>
    {message.content}
    <Text style={{ opacity: 0.5 }}>▍</Text>  {/* 闪烁光标 */}
  </Text>
)}

// success 或 error：显示完整内容
{(isUser || message.status === 'success' || message.status === 'error') &&
  message.content && <Text>{message.content}</Text>}
```

**闪烁光标 `▍`** 是一个 Unicode 字符，不是 CSS 动画。简单但有效。

---

### 文件 7：`src/app.tsx` — 应用级 WebSocket 生命周期

```typescript
// 切到后台 → 断开 WebSocket（省电、省连接）
useDidHide(() => { ws.disconnect() })

// 切回前台 → 刷新 token → 重新连接
useDidShow(async () => {
  await refreshTokenIfNeeded()
  const { accessToken, userInfo } = getStoredState()
  if (accessToken && userInfo?.account && !ws.connected) {
    ws.connect(accessToken, userInfo.account)
  }
})
```

**为什么切后台要断开？** 微信小程序后台运行时间有限，保持 WebSocket 连接也没有意义。断开可以释放服务端资源。

**为什么切前台要刷新 token？** JWT token 有有效期，回到前台时可能已经过期。先刷新 token 再连接，避免连接后立刻认证失败。

---

### 文件 8：`src/api/chat.ts` — HTTP API（辅助通道）

WebSocket 负责实时通信，HTTP 负责数据加载：

| API | 方法 | 用途 |
|-----|------|------|
| `getConversations()` | GET `/ai-qa/sessions` | 拉取会话列表 |
| `getMessages(sessionId, cursor?)` | POST `/ai-qa/history/detail` | 拉取消息历史（分页） |
| `getSkills()` | GET `/v1/app/skills` | 拉取可用技能 |

**为什么分页用游标（cursor）而不是页码？** 游标分页在数据变动时不会重复或遗漏。比如用"第2页"的方式，如果新增了数据，第二页就会出现重复。

---

## 四、完整消息流程（从输入到展示）

```
用户输入"你好" → 点击发送
        │
        ▼
ChatInput.handleSend("你好")
        │
        ▼
chatStore.sendMessage("你好")
        ├── 1. 检查 sessionOccupied（被占用则拒绝）
        ├── 2. 创建 userMsg（id: u-xxx, status: success）
        ├── 3. 创建 aiMsg  （id: a-xxx, status: pending, content: ''）
        ├── 4. appendMessage() 两次 → 消息立即出现在屏幕上
        ├── 5. requestToAssistantMsg[requestId] = { sessionId, msgId }
        └── 6. ws.sendChat({ output_type: 'stream', request_id, ... })
                    │
                    ▼ JSON.stringify → WebSocket 发送
                    │
        ════════════ 网络传输 ════════════
                    │
                    ▼
服务端接收 → 调用 Coze AI → 逐个 token 返回
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
  stream_chunk  stream_chunk  stream_done
  "你好"         "，我是"       "你好，我是AI助手..."
        │           │           │
        ▼           ▼           ▼
ws.handleMessage() 解析 JSON → emit(event_type, data)
        │
        ▼
chatStore 的 ws.on('stream_chunk') 回调：
  1. 通过 request_id 找到 { sessionId, msgId }
  2. msg.content += data.content  // 拼接
  3. updateMessageStatus(sessionId, msgId, 'streaming', newContent)
        │
        ▼
MessageBubble 重渲染：
  status='streaming' → 显示"你好，我是▍"（闪烁光标）
        │
        ... 反复收到 stream_chunk，反复拼接 ...
        │
        ▼
chatStore 的 ws.on('stream_done') 回调：
  1. updateMessageStatus(sessionId, msgId, 'success', data.content)
  2. 如果 currentConversationId 是 'pending-xxx' → 替换为真实 session_id
        │
        ▼
MessageBubble 重渲染：
  status='success' → 显示"你好，我是AI助手，有什么可以帮你？"
  （没有闪烁光标了）

完成 ✓
```

---

## 五、设计决策汇总

| 决策 | 原因 |
|------|------|
| WebSocket 而非 HTTP 轮询 | 流式输出需要实时推送，轮询延迟高且浪费资源 |
| 乐观更新 | 用户点发送后立即看到消息，体验丝滑 |
| request_id 映射表 | WebSocket 全双工，可能同时有多条请求在飞 |
| pending-xxx 临时 ID | 新会话没有真实 ID，等首次回复后替换 |
| 服务端拼接完整内容 | 防止前端丢包导致内容不完整 |
| 事件 pub/sub 模式 | 解耦 ws 连接层和业务逻辑层 |
| 单例 ws | 全局共享一个连接，避免重复连接 |
| 指数退避重连 | 网络恢复前不频繁重试，减少服务端压力 |
| 心跳 30s / 超时 90s | 保持连接活跃，及时检测断连 |
| abort 5s 超时 | 用户点停止后快速响应，不长时间等待 |
| 游标分页（非页码） | 数据变动时不会重复或遗漏 |
| 切后台断连，前台重连 | 省电省资源，同时刷新 token |

---

## 六、关键代码片段速查

**如何判断是否正在流式输出？**
```typescript
const isResponding = messages.some(
  (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
)
```

**如何通过 request_id 找到对应消息？**
```typescript
const mapping = requestToAssistantMsg[data.request_id]
// mapping = { sessionId: 'pending-xxx', msgId: 'a-1716638400' }
```

**如何生成唯一请求 ID？**
```typescript
generateRequestId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
```

**如何将临时会话替换为真实会话？**
```typescript
// 关键：在 Zustand 中做 key 迁移
const { [currentConversationId]: pendingConv, ...restConvs } = state.conversations
const { [currentConversationId]: pendingMsgs, ...restMsgs } = state.messagesBySession
// 用 data.session_id 作为新 key
conversations: { [data.session_id]: { ...pendingConv, id: data.session_id }, ...restConvs }
messagesBySession: { [data.session_id]: pendingMsgs || [], ...restMsgs }
```
