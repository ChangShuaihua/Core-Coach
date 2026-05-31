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
}

const ChatInput = ({
  onSend,
  onStop,
  onSkillClick,
  isResponding,
  selectedSkillName,
  disabled,
}: ChatInputProps) => {
  const [value, setValue] = useState('')

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
    <View>
      {onSkillClick && (
        <View className="py-2">
          <SkillButton onClick={onSkillClick} selectedSkillName={selectedSkillName} />
        </View>
      )}

      <View className="px-4 pb-3 bg-white flex flex-row items-center gap-2">
        <View
          className="shadow-md flex-1 rounded-2xl px-4 py-3"
          style={{ border: '1px solid #d1d5db' }}
        >
          <Textarea
            value={value}
            onInput={(e) => setValue(e.detail.value)}
            placeholder={disabled ? '该会话正在其他设备使用中' : '发送消息...'}
            placeholderClass="text-gray-400"
            disabled={disabled}
            adjustPosition={false}
            showConfirmBar={false}
            autoHeight
            maxlength={2000}
            className="text-sm bg-transparent w-full"
            style={{ minHeight: '50px', maxHeight: '98px', fontSize: '16px' }}
          />
        </View>

        <View
          onClick={handleAction}
          className="shadow w-7 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: disabled
              ? '#e5e7eb'
              : isResponding
                ? '#ef4444'
                : value.trim()
                  ? '#f97316'
                  : '#d1d5db',
            minHeight: '70px',
          }}
        >
          <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
            {isResponding ? <Close size={18} color="#fff" /> : '↑'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ChatInput
