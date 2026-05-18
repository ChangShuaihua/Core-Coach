import { useState } from 'react'
import { View, Textarea, Text } from '@tarojs/components'
import SkillButton from './SkillButton'

interface ChatInputProps {
  onSend: (content: string) => void
  onSkillClick?: () => void
  disabled?: boolean
}

const ChatInput = ({ onSend, onSkillClick, disabled }: ChatInputProps) => {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  return (
    <View>
      {onSkillClick && (
        <View className="py-2">
          <SkillButton onClick={onSkillClick} />
        </View>
      )}

      <View className="px-4 pb-3 bg-white flex flex-row items-center gap-2">
        <View
          className="shadow-md flex-1 rounded-2xl px-4 py-3"
          style={{
            border: '1px solid #d1d5db',
          }}
        >
          <Textarea
            value={value}
            onInput={(e) => setValue(e.detail.value)}
            placeholder="发送消息..."
            placeholderClass="text-gray-400"
            adjustPosition={false}
            showConfirmBar={false}
            autoHeight
            maxlength={2000}
            className="text-sm bg-transparent w-full"
            style={{ minHeight: '50px', maxHeight: '98px', fontSize: '16px' }}
          />
        </View>

        <View
          onClick={handleSend}
          className="shadow w-7 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: value.trim() && !disabled ? '#f97316' : '#d1d5db',
            minHeight: '70px',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>↑</Text>
        </View>
      </View>
    </View>
  )
}

export default ChatInput
