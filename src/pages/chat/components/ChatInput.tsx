import { useState } from 'react'
import { View, Input, Text } from '@tarojs/components'
import SkillButton from './SkillButton'

interface ChatInputProps {
  onSend: (content: string) => void
  onSkillClick?: () => void
}

const ChatInput = ({ onSend, onSkillClick }: ChatInputProps) => {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim()) return
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
        {/* 2. 输入框容器 */}
        <View
          className="shadow-md flex-1 rounded-full px-4 h-10 flex items-center"
          style={{ border: '1px solid #d1d5db' }}
        >
          <Input
            value={value}
            onInput={(e) => setValue(e.detail.value)}
            placeholder="发送消息..."
            placeholderClass="text-gray-400"
            confirmType="send"
            onConfirm={handleSend}
            adjustPosition={false}
            cursorSpacing={20}
            className="flex-1 text-sm h-full bg-transparent"
          />
        </View>

        <View
          onClick={handleSend}
          className="shadow w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: value.trim() ? '#f97316' : '#d1d5db',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>↑</Text>
        </View>
      </View>
    </View>
  )
}

export default ChatInput
