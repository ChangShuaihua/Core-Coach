import { View, Text } from '@tarojs/components'
import { PullToRefresh } from '@nutui/nutui-react-taro'
import { clsx } from 'clsx'
import dayjs from 'dayjs'
import { useChatStore } from '@/store/chatStore'
import { Conversation } from '../types'

// 按日期分组
function groupByDate(conversations: Conversation[]) {
  const groups: Record<string, Conversation[]> = {}

  conversations
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((conv) => {
      const date = dayjs(conv.updatedAt)
      const today = dayjs()

      let label: string
      if (date.isSame(today, 'day')) {
        label = '今天'
      } else if (date.isSame(today.subtract(1, 'day'), 'day')) {
        label = '昨天'
      } else if (date.isAfter(today.subtract(7, 'day'))) {
        label = '最近7天'
      } else {
        label = '更早'
      }

      if (!groups[label]) groups[label] = []
      groups[label].push(conv)
    })

  return groups
}

// 单个会话项
function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}) {
  return (
    <View
      className={clsx(
        'px-4 py-3 mx-2 mb-1 rounded-lg',
        isActive ? 'bg-orange-1' : 'bg-transparent'
      )}
      onClick={onClick}
    >
      <View className="flex items-center justify-between">
        <Text
          className={clsx(
            'text-sm flex-1 truncate',
            isActive ? 'text-orange-500 font-medium' : 'text-gray-800'
          )}
        >
          {conversation.title}
        </Text>
        <Text className="text-xs text-gray-400 ml-2 flex-shrink-0">
          {dayjs(conversation.updatedAt).format('HH:mm')}
        </Text>
      </View>
      {conversation.lastMessage && (
        <Text className="text-xs text-gray-400 mt-1 block truncate">
          {conversation.lastMessage}
        </Text>
      )}
    </View>
  )
}

export default function ConversationList() {
  const conversations = useChatStore((s) => s.conversations)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const switchConversation = useChatStore((s) => s.switchConversation)
  const refreshConversations = useChatStore((s) => s.refreshConversations)

  const grouped = groupByDate(conversations)

  const handleRefresh = async () => {
    await refreshConversations()
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <View className="h-full overflow-y-auto py-2">
        {Object.keys(grouped).length === 0 ? (
          <View className="flex items-center justify-center h-40 text-gray-400 text-sm">
            暂无对话记录
          </View>
        ) : (
          Object.entries(grouped).map(([label, convs]) => (
            <View key={label} className="mb-2">
              <View className="px-4 py-2 text-xs text-gray-400">{label}</View>
              {convs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === currentConversationId}
                  onClick={() => switchConversation(conv.id)}
                />
              ))}
            </View>
          ))
        )}
      </View>
    </PullToRefresh>
  )
}
