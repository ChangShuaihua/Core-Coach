import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { clsx } from 'clsx'
import { useChatStore } from '@/store/chatStore'
import { Conversation } from '@/types/chat'

// 单个会话项
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const isPending = conversation.id.startsWith('pending-')

  const handleDelete = (e) => {
    e.stopPropagation()
    Taro.showModal({
      title: '提示',
      content: '确定删除该对话？删除后不可恢复',
      success: async (res) => {
        if (res.confirm) {
          try {
            await onDelete()
            Taro.showToast({ title: '已删除', icon: 'success' })
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  return (
    <View
      className={clsx(
        'px-4 py-3 mx-2 mb-1 rounded-lg flex items-center justify-between',
        isActive ? 'bg-orange-1' : 'bg-transparent'
      )}
      onClick={onClick}
    >
      <Text
        className={clsx(
          'text-sm block truncate flex-1',
          isActive ? 'text-orange-500 font-medium' : 'text-gray-800'
        )}
      >
        {conversation.title}
      </Text>
      {!isPending && (
        <View
          className="ml-2 px-1"
          style={{ fontSize: '16px', color: '#999', lineHeight: '1' }}
          onClick={handleDelete}
        >
          ···
        </View>
      )}
    </View>
  )
}

export default function ConversationList({ onSelect }: { onSelect?: () => void }) {
  const conversationsMap = useChatStore((s) => s.conversations)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const switchConversation = useChatStore((s) => s.switchConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)
  const loadMoreConversations = useChatStore((s) => s.loadMoreConversations)

  // 从 Record 转为数组，pending 会话置顶，其余按更新时间倒序
  const sorted = Object.values(conversationsMap).sort((a, b) => {
    const aPending = a.id.startsWith('pending-')
    const bPending = b.id.startsWith('pending-')
    if (aPending && !bPending) return -1
    if (!aPending && bPending) return 1
    return b.updatedAt - a.updatedAt
  })

  const handleClick = (id: string) => {
    switchConversation(id)
    onSelect?.()
  }

  return (
    <ScrollView scrollY className="h-full mt-2" onScrollToLower={loadMoreConversations}>
      {sorted.length === 0 ? (
        <View className="flex items-center justify-center h-40 text-gray-400 text-sm">
          暂无对话记录
        </View>
      ) : (
        <>
          {sorted.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === currentConversationId}
              onClick={() => handleClick(conv.id)}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))}
          <View className="h-4"></View>
        </>
      )}
    </ScrollView>
  )
}
