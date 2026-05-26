# WebSocket 实时通信协议

## 架构概述

- 流式 / 非流式 AI 问答统一通过 WebSocket + Redis Stream 通道完成。
- 每个会话（`session_id`）独占一个 Redis Stream，Stream Key 格式：`ws:session:{session_id}`。
- 服务端将 Coze 工作流响应写入对应 Stream，WebSocket Hub 消费后推送至客户端。

## 事件类型清单

| event_type | 方向 | 说明 |
|---|---|---|
| `auth` | 客户端 → 服务端 | 连接认证 |
| `connected` | 服务端 → 客户端 | 认证成功 |
| `auth_failed` | 服务端 → 客户端 | 认证失败 |
| `ping` | 客户端 → 服务端 | 心跳检测 |
| `pong` | 服务端 → 客户端 | 心跳响应 |
| `chat` | 客户端 → 服务端 | 发送聊天消息 |
| `reply` | 服务端 → 客户端 | 非流式完整回复 |
| `stream_chunk` | 服务端 → 客户端 | 流式分片推送 |
| `stream_done` | 服务端 → 客户端 | 流式推送结束 |
| `error` | 服务端 → 客户端 | 错误通知 |
| `session_switch` | 客户端 → 服务端 | 切换会话 |
| `abort` | 客户端 → 服务端 | 中断当前生成 |
| `abort_result` | 服务端 → 客户端 | 中断结果确认 |
| `reconnect` | 客户端 → 服务端 | 断网重连请求 |
| `reconnect_result` | 服务端 → 客户端 | 重连结果（含遗漏消息） |
| `disconnect` | 客户端 → 服务端 | 主动断开连接 |

---

## 建立连接（认证）

```json
{
  "event_type": "auth",
  "data": {
    "user_id": "account",
    "token": "jwt_xxx"
  }
}
```

### 认证成功

```json
{
  "event_type": "connected",
  "data": {
    "content": "success"
  }
}
```

### 认证失败

```json
{
  "event_type": "auth_failed",
  "data": {
    "code": 401,
    "message": "Token已过期或无效",
    "retry_after": 30
  }
}
```

---

## 发送消息（chat）

```json
{
  "event_type": "chat",
  "data": {
    "output_type": "stream",
    "request_id": "uuid",
    "session_id": "conv_001",
    "content": "你好",
    "workflow_id": "7519292008443281458",
    "create_time": 1716638400
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `output_type` | string | 是 | `"stream"` 流式 / `"sync"` 非流式 |
| `request_id` | string | 是 | 前端生成的请求唯一标识 |
| `session_id` | string | 是 | 会话 ID，空字符串时服务端自动创建 |
| `content` | string | 是 | 用户提问内容 |
| `workflow_id` | string | 否 | 指定工作流 ID，为空则使用默认配置 |
| `create_time` | int64 | 是 | Unix 秒级时间戳 |

---

## 非流式回复（reply）

```json
{
  "event_type": "reply",
  "data": {
    "output_type": "sync",
    "request_id": "uuid",
    "session_id": "conv_001",
    "content": "这是完整的AI回复内容",
    "create_time": 1716638400,
    "finished": true
  }
}
```

---

## 流式回复（stream_chunk + stream_done）

逐分片推送，每个中间分片用 `stream_chunk`，最终结束用 `stream_done`。

### 流式分片

```json
{
  "event_type": "stream_chunk",
  "data": {
    "output_type": "stream",
    "request_id": "uuid",
    "session_id": "conv_001",
    "stream_id": "1716638400123-0",
    "chunk_index": 0,
    "content": "你好，这是第一段",
    "create_time": 1716638400,
    "finished": false
  }
}
```

### 流式结束

```json
{
  "event_type": "stream_done",
  "data": {
    "output_type": "stream",
    "request_id": "uuid",
    "session_id": "conv_001",
    "total_chunks": 5,
    "content": "完整拼接的AI回复内容",
    "create_time": 1716638403,
    "finished": true
  }
}
```

> **注意**：`stream_done.content` 为服务端拼接好的完整回复，前端可直接用于展示和持久化校验，无需自行拼接。

---

## 会话切换（session_switch）

```json
{
  "event_type": "session_switch",
  "data": {
    "request_id": "uuid",
    "old_session_id": "conv_001",
    "new_session_id": "conv_002",
    "switch_reason": "user_initiated",
    "create_time": 1716638400
  }
}
```

> 切会话只改变消费的 Stream，不触发工作流调用。如需"切换并立即提问"，切完后再发 `chat` 事件。

---

## 中断生成（abort）

### 客户端发送

```json
{
  "event_type": "abort",
  "data": {
    "request_id": "uuid",
    "session_id": "conv_001",
    "reason": "user_cancelled",
    "create_time": 1716638400
  }
}
```

### 服务端响应

```json
{
  "event_type": "abort_result",
  "data": {
    "request_id": "uuid",
    "session_id": "conv_001",
    "success": true,
    "stopped_at_chunk": 5,
    "message": "消息发送已中断",
    "create_time": 1716638400
  }
}
```

### abort 后处理规范

1. 服务端通过 `context.Cancel()` 取消正在进行的 Coze API 调用。
2. 将对应 `request_id` 的**已写入 Redis Stream 但尚未消费的分片**标记为 `status: "cancelled"`。
3. 将已累积的内容保存为 `ChatMessage`（role=`assistant`），`content` 为中断前已生成的部分。
4. 重连/历史查询时跳过 `status: "cancelled"` 的分片。

---

## 断网重连（reconnect）

### 客户端发送

```json
{
  "event_type": "reconnect",
  "data": {
    "user_id": "user_123",
    "token": "jwt_xxx",
    "last_stream_id": "1716638400123-5",
    "session_id": "conv_001"
  }
}
```

| 字段 | 说明 |
|---|---|
| `last_stream_id` | 客户端断网前最后成功接收的 Redis Stream ID，服务端从此 ID 之后开始补推 |
| `session_id` | 需要恢复的会话 ID |

### 服务端响应

```json
{
  "event_type": "reconnect_result",
  "data": {
    "success": true,
    "has_active_stream": true,
    "missed_messages": [
      {
        "event_type": "stream_chunk",
        "data": {
          "request_id": "uuid",
          "session_id": "conv_001",
          "stream_id": "1716638400123-6",
          "chunk_index": 6,
          "content": "这是断网期间漏掉的分片...",
          "finished": false,
          "create_time": 1716638402
        }
      },
      {
        "event_type": "stream_chunk",
        "data": {
          "request_id": "uuid",
          "session_id": "conv_001",
          "stream_id": "1716638400123-7",
          "chunk_index": 7,
          "content": "最后一个分片",
          "finished": false,
          "create_time": 1716638403
        }
      }
    ],
    "create_time": 1716638405
  }
}
```

| 字段 | 说明 |
|---|---|
| `has_active_stream` | `true` 表示仍有 Coze 流式输出在进行中，补推完后继续实时推送 |
| `missed_messages` | 遗漏的消息数组（按时间升序），不包含 `status: "cancelled"` 的分片 |

### 重连后续推机制

1. `reconnect_result` 中补推完所有遗漏消息。
2. 若 `has_active_stream == true`，服务端继续将后续 Coze 分片作为 `stream_chunk` 实时推送。
3. Coze 流式结束后发送 `stream_done`。
4. 客户端可通过 `request_id` 将补推消息和实时消息关联到同一次问答。

---

## 主动断开（disconnect）

```json
{
  "event_type": "disconnect",
  "data": {
    "session_id": "conv_001",
    "reason": "user_leaving",
    "create_time": 1716638400
  }
}
```

服务端收到后：
1. 关闭 WebSocket 连接。
2. 从 Consumer Group 中移除该消费者的 pending 消息，避免消息积压。
3. 若当前会话没有其他活跃连接，可延迟清理该 Stream（见下文）。

---

## Redis Stream 消息结构

每会话一个 Stream，Key：`ws:session:{session_id}`

```json
{
  "client_msg_id": "c_abc123",
  "stream_id": "1716638400123-0",
  "request_id": "uuid",
  "session_id": "conv_001",
  "user_id": 1001,
  "workflow_id": "7519292008443281458",
  "event_type": "stream_chunk",
  "chunk_index": 0,
  "content": "内容片段",
  "is_finished": false,
  "create_time": 1716638400,
  "status": "pending"
}
```

| 字段 | 说明 |
|---|---|
| `client_msg_id` | 客户端生成的消息 ID，用于去重 |
| `stream_id` | Redis Stream 自动分配的 ID |
| `event_type` | 对应协议中的事件类型 |
| `chunk_index` | 流式分片序号（从 0 开始），非流式固定为 0 |
| `status` | `pending` → `sent`（已推送）→ `acked`（客户端确认）/ `cancelled`（中断废弃） |
| `is_finished` | 是否为该次请求的最后一个分片 |

### Stream 生命周期

- **TTL**：Stream 设置 `EXPIRE`（建议 24h），超时自动删除。
- **MAXLEN**：每个 Stream 设置 `MAXLEN ~ 5000`，防止无限增长。
- **清理时机**：`disconnect` 时若该会话无其他消费者，延迟 5 分钟后再检查删除（给重连留窗口）。

---

## WebSocket Client 结构

```go
type Client struct {
    Conn       *websocket.Conn
    UserID     int64
    SessionID  string
    LastActive time.Time
}
```

---

## Coze API 错误通知

```json
{
  "event_type": "error",
  "data": {
    "code": "WS_ERR_COZE_TIMEOUT",
    "http_code": 504,
    "message": "Coze API 调用超时",
    "request_id": "uuid",
    "session_id": "conv_001",
    "recoverable": true,
    "suggested_action": "retry",
    "create_time": 1716638400
  }
}
```

| 错误码 | 说明 | recoverable |
|---|---|---|
| `WS_ERR_COZE_TIMEOUT` | Coze API 超时 | true |
| `WS_ERR_COZE_AUTH` | Coze 鉴权失败 | false |
| `WS_ERR_COZE_INTERNAL` | Coze 内部错误 | true |
| `WS_ERR_STREAM_EXPIRED` | Redis Stream 已过期 | false |

---

## 心跳检测

### 客户端 → 服务端（ping）

```json
{
  "event_type": "ping",
  "data": {
    "timestamp": 1716638400,
    "session_id": "conv_001"
  }
}
```

### 服务端 → 客户端（pong）

```json
{
  "event_type": "pong",
  "data": {
    "timestamp": 1716638400,
    "server_time": 1716638401,
    "connection_status": "active"
  }
}
```

- 客户端每 30s 发送 `ping`。
- 服务端 90s 未收到任何消息则主动断开连接。
