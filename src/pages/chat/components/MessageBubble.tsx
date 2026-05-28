import { View, Text } from '@tarojs/components'
import dayjs from 'dayjs'
import { Message } from '@/types/chat'

// 格式化时间：今天显示时分，昨天显示"昨天 HH:mm"，更早显示完整日期
function formatTime(timestamp: number): string {
  const date = dayjs(timestamp)
  const now = dayjs()
  const diffDays = now.diff(date, 'day')

  if (diffDays === 0) {
    // 今天：显示时分
    return date.format('HH:mm')
  } else if (diffDays === 1) {
    // 昨天
    return date.format('昨天 HH:mm')
  } else if (diffDays < 7) {
    // 一周内：显示星期几
    return date.format('dddd HH:mm')
  } else {
    // 更早：显示完整日期
    return date.format('MM/DD HH:mm')
  }
}

interface MessageBubbleProps {
  message: Message
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user'

  const bubbleStyle: React.CSSProperties = {
    maxWidth: '75%',
    borderRadius: '12px',
    padding: '10px 14px',
    backgroundColor: isUser ? '#fe8329' : message.status === 'error' ? '#fef2f2' : '#f3f4f6',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    border: message.status === 'error' ? '1px solid #fca5a5' : 'none',
  }

  const textStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: isUser ? '#ffffff' : message.status === 'error' ? '#dc2626' : '#1f2937',
    wordBreak: 'break-word',
  }

  return (
    <View className="flex flex-col mb-2 px-4">
      {/* 时间戳 */}
      <View className="mb-1 flex" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <Text style={{ fontSize: '10px', color: '#9ca3af', padding: '0 4px' }}>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {/* 气泡 */}
      <View className="flex" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <View style={bubbleStyle}>
          {/* pending：打字指示器 */}
          {!isUser && message.status === 'pending' && (
            <Text style={{ ...textStyle, color: '#9ca3af' }}>AI正在思考...</Text>
          )}

          {/* streaming：打字机效果 */}
          {!isUser && message.status === 'streaming' && (
            <Text style={textStyle}>
              {message.content}
              <Text style={{ opacity: 0.5 }}>▍</Text>
            </Text>
          )}

          {/* success / error / user：显示内容 */}
          {(isUser || message.status === 'success' || message.status === 'error') &&
            message.content && <Text style={textStyle}>{message.content}</Text>}
        </View>
      </View>
    </View>
  )
}

export default MessageBubble
