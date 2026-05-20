import { View, Text } from '@tarojs/components'
import { PullToRefresh } from '@nutui/nutui-react-taro'
import { clsx } from 'clsx'
import { useChatStore } from '@/store/chatStore'
import { Conversation } from '@/types/chat'

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
      <Text
        className={clsx(
          'text-sm block truncate',
          isActive ? 'text-orange-500 font-medium' : 'text-gray-800'
        )}
      >
        {conversation.title}
      </Text>
    </View>
  )
}

export default function ConversationList() {
  const conversations = useChatStore((s) => s.conversations)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const switchConversation = useChatStore((s) => s.switchConversation)
  const refreshConversations = useChatStore((s) => s.loadConversations)

  // 按更新时间倒序排列
  const sorted = conversations.slice().sort((a, b) => b.updatedAt - a.updatedAt)

  const handleRefresh = async () => {
    await refreshConversations()
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <View className="h-full overflow-y-auto py-2">
        {sorted.length === 0 ? (
          <View className="flex items-center justify-center h-40 text-gray-400 text-sm">
            暂无对话记录
          </View>
        ) : (
          sorted.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === currentConversationId}
              onClick={() => switchConversation(conv.id)}
            />
          ))
        )}
      </View>
    </PullToRefresh>
  )
}
