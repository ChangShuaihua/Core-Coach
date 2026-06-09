import { useState } from 'react'
import { View, Textarea, Text } from '@tarojs/components'
import { Close } from '@nutui/icons-react-taro'
import SkillButton from './SkillButton'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  onSkillClick?: () => void
  isResponding?: boolean
  selectedSkillName?: string | null
  disabled?: boolean
  disabledReason?: string
}

const ChatInput = ({
  onSend,
  onStop,
  onSkillClick,
  isResponding,
  selectedSkillName,
  disabled,
  disabledReason,
}: ChatInputProps) => {
  const [value, setValue] = useState('')
  const canSend = !!value.trim() && !disabled

  const handleSend = () => {
    if (!value.trim() || isResponding || disabled) return
    onSend(value)
    setValue('')
  }

  const handleAction = () => {
    if (isResponding) {
      onStop?.()
    } else {
      handleSend()
    }
  }

  return (
    <View className="bg-white">
      {onSkillClick && (
        <View className="ml-2 px-4 pt-2 pb-2 flex flex-row items-center">
          <SkillButton onClick={onSkillClick} selectedSkillName={selectedSkillName} />
          {disabledReason && !isResponding && (
            <Text
              style={{
                marginLeft: '12px',
                fontSize: '12px',
                color: '#9ca3af',
                flex: 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {disabledReason}
            </Text>
          )}
        </View>
      )}

      <View className="px-4 pb-3 flex flex-row items-end gap-2">
        <View
          className="flex-1 px-3 py-2"
          style={{
            minHeight: '40px',
            borderRadius: '16px',
            border: '1px solid #b8b8b8',
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(15,23,42,0.08)',
            boxSizing: 'border-box',
          }}
        >
          <Textarea
            value={value}
            onInput={(e) => setValue(e.detail.value)}
            placeholder={disabledReason || (disabled ? '暂时无法发送消息' : '发送消息...')}
            placeholderClass="text-gray-400"
            disabled={disabled}
            adjustPosition={false}
            showConfirmBar={false}
            autoHeight
            maxlength={2000}
            className="text-sm bg-transparent w-full"
            style={{
              maxHeight: '96px',
              fontSize: '16px',
              padding: 0,
            }}
          />
        </View>

        <View
          onClick={handleAction}
          className="shadow flex items-center justify-center"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50px',
            backgroundColor: isResponding ? '#ef4444' : canSend ? '#f97316' : '#e5e7eb',
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: '22px',
              fontWeight: 'bold',
              lineHeight: '22px',
            }}
          >
            {isResponding ? <Close size={18} color="#fff" /> : '↑'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ChatInput
