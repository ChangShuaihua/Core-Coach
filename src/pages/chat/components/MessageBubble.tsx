import { View, Text } from '@tarojs/components'
import { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user'

  // 1. 气泡样式：去掉了内部的时间戳处理，专注于容器本身
  const bubbleStyle: React.CSSProperties = {
    maxWidth: '75%',
    borderRadius: '12px',
    padding: '10px 14px',
    backgroundColor: isUser ? '#fe8329' : '#f3f4f6',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  }

  const textStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: isUser ? '#ffffff' : '#1f2937',
    wordBreak: 'break-word',
  }

  return (
    <View className="flex flex-col mb-4 px-4">
      {/* 1. 时间戳：放在气泡上方，并根据角色决定居左还是居右 */}
      <View className="mb-1 flex" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <Text style={{ fontSize: '10px', color: '#9ca3af', padding: '0 4px' }}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* 2. 气泡主体 */}
      <View className="flex" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{message.content}</Text>
        </View>
      </View>
    </View>
  )
}

export default MessageBubble
