import { View, Text } from '@tarojs/components'
import { Message } from '@/types/chat'

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
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* 气泡 */}
      <View className="flex" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <View style={bubbleStyle}>
          {/* pending：打字指示器 */}
          {!isUser && message.status === 'pending' && (
            <Text style={{ ...textStyle, color: '#9ca3af' }}>正在输入...</Text>
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
