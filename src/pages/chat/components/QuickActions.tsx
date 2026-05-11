import { View } from '@tarojs/components'
import { Cell } from '@nutui/nutui-react-taro'
import { QUICK_ACTIONS } from '../constants/quickActions'
import type { QuickAction } from '../types'

interface QuickActionsPopupProps {
  visible: boolean
  onClose: () => void
  onSelect: (action: QuickAction) => void
}

export default function QuickActionsPopup({ visible, onClose, onSelect }: QuickActionsPopupProps) {
  return (
    <>
      {visible && (
        <View onClick={onClose}>
          {/* 卡片主体 */}
          <View
            className="rounded-2xl bg-white"
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}
          >
            <Cell.Group>
              {QUICK_ACTIONS.map((action, index) => (
                <Cell
                  key={action.id}
                  title={action.title}
                  clickable
                  onClick={() => {
                    onSelect(action)
                    onClose()
                  }}
                  style={{
                    borderBottom: index < QUICK_ACTIONS.length - 1 ? '1px solid #f5f5f5' : 'none',
                    padding: '14px 16px',
                    fontSize: '14px',
                  }}
                />
              ))}
            </Cell.Group>
          </View>
        </View>
      )}
    </>
  )
}
