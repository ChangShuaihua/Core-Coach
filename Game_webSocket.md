## 游戏生成联调约定

### 目的

- 游戏生成模块复用现有 WebSocket 连接和认证方式
- 前端提交生成请求后，不再轮询详情接口获取结果
- 服务端通过 `game_generate_status` 主动推送状态变化给当前登录用户

### 连接地址

```text
ws://localhost:8083/api/v1/ws/connect
```

### 认证方式

- WebSocket 建立连接后，前端必须先发送 `auth`
- `token` 使用应用端登录接口返回的 JWT
- 认证成功后，当前连接会和登录用户绑定，后续该用户的游戏生成状态会推送到这个连接

认证请求：

```json
{
  "event_type": "auth",
  "data": {
    "token": "替换为真实 JWT"
  }
}
```

认证成功响应：

```json
{
  "event_type": "connected",
  "data": {
    "content": "success"
  }
}
```

认证失败响应：

```json
{
  "event_type": "auth_failed",
  "data": {
    "code": 401,
    "message": "Token无效或已过期",
    "retry_after": 30
  }
}
```

### 推送事件

- 事件名统一为：`game_generate_status`
- 服务端只推给当前登录用户的在线连接
- 前端收到后根据 `status` 更新页面

通用消息格式：

```json
{
  "event_type": "game_generate_status",
  "data": {
    "record_id": 123,
    "status": "queued",
    "message": "任务已入队",
    "estimated_seconds": 270,
    "create_time": 1717000000
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `event_type` | string | 是 | 固定为 `game_generate_status` |
| `data.record_id` | number | 是 | 游戏生成记录 ID，对应生成接口返回的 `record_id` |
| `data.status` | string | 是 | 当前任务状态 |
| `data.message` | string | 是 | 给前端直接展示的简短文案 |
| `data.create_time` | number | 是 | 服务端推送时间，Unix 秒时间戳 |
| `data.estimated_seconds` | number | 否 | 预计耗时秒数，仅 `queued` 时通常会返回 |
| `data.result` | object | 否 | 生成成功时返回的结果对象 |
| `data.error` | string | 否 | 生成失败时返回的错误描述 |

### status 枚举

| 状态值 | 含义 | 前端建议处理 |
| --- | --- | --- |
| `queued` | 任务已入队，等待 worker 消费 | 展示“排队中” |
| `generating` | 任务已开始生成 | 展示“生成中” |
| `success` | 任务生成成功 | 用 `result` 更新页面 |
| `failed` | 任务生成失败 | 展示失败原因或提示重新生成 |

### 各状态示例

任务入队：

```json
{
  "event_type": "game_generate_status",
  "data": {
    "record_id": 123,
    "status": "queued",
    "message": "任务已入队",
    "estimated_seconds": 270,
    "create_time": 1717000000
  }
}
```

任务开始生成：

```json
{
  "event_type": "game_generate_status",
  "data": {
    "record_id": 123,
    "status": "generating",
    "message": "游戏生成中",
    "create_time": 1717000015
  }
}
```

任务生成成功：

```json
{
  "event_type": "game_generate_status",
  "data": {
    "record_id": 123,
    "status": "success",
    "message": "生成成功",
    "create_time": 1717000200,
    "result": {
      "game_name": "动物拼图小游戏",
      "generated_content": "这里是 AI 生成的完整游戏内容",
      "music": "https://example.com/game-music/demo.mp3",
      "music_storage_status": "stored"
    }
  }
}
```

任务生成失败：

```json
{
  "event_type": "game_generate_status",
  "data": {
    "record_id": 123,
    "status": "failed",
    "message": "生成失败",
    "create_time": 1717000200,
    "error": "调用工作流失败"
  }
}
```

### 前端联调流程

1. 前端建立 WebSocket 连接
2. 连接成功后立即发送 `auth`
3. 收到 `connected` 后，认为当前连接可接收推送
4. 前端调用游戏生成接口，拿到 `record_id`
5. 前端监听 `game_generate_status`
6. 收到消息后，先判断 `data.record_id` 是否为当前页面关注的记录
7. 再根据 `data.status` 更新页面状态

### 前端处理建议

- 同一用户可能会收到多个任务的状态，前端必须按 `record_id` 过滤
- 前端不要依赖消息顺序做强假设，建议始终以最新状态覆盖页面
- 如果 WebSocket 断开，前端可重连后继续监听
- 如果用户在生成完成前刷新页面，允许用一次详情接口兜底查询当前状态

### 推荐前端监听示例

```javascript
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.event_type !== "game_generate_status") {
    return;
  }

  const payload = message.data || {};
  if (payload.record_id !== currentRecordId) {
    return;
  }

  switch (payload.status) {
    case "queued":
      // 更新为排队中
      break;
    case "generating":
      // 更新为生成中
      break;
    case "success":
      // 使用 payload.result 渲染结果
      break;
    case "failed":
      // 展示 payload.error
      break;
  }
};
```
