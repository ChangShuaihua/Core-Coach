import { View, ScrollView } from '@tarojs/components'
import { Cell } from '@nutui/nutui-react-taro'
import type { Skill } from '@/types/chat'

// 每个 Cell 高度约 43px (padding 14*2 + font 14 + border 1)
const CELL_HEIGHT = 49
const MAX_VISIBLE = 4

interface QuickActionsPopupProps {
  visible: boolean
  skills: Skill[]
  selectedSkill: Skill | null
  onClose: () => void
  onSelect: (skill: Skill) => void
}

export default function QuickActionsPopup({
  visible,
  skills,
  selectedSkill,
  onClose,
  onSelect,
}: QuickActionsPopupProps) {
  const maxHeight = Math.min(skills.length, MAX_VISIBLE) * CELL_HEIGHT

  return (
    <>
      {visible && (
        <View onClick={onClose}>
          <View
            className="rounded-2xl bg-white"
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              height: `${maxHeight}px`,
              overflow: 'hidden',
            }}
          >
            <ScrollView scrollY style={{ height: `${maxHeight}px` }}>
              <Cell.Group>
                {skills.map((skill, index) => {
                  const isSelected = selectedSkill?.id === skill.id
                  return (
                    <Cell
                      key={skill.id}
                      title={skill.title}
                      clickable
                      onClick={() => {
                        onSelect(skill)
                        onClose()
                      }}
                      style={{
                        borderBottom: index < skills.length - 1 ? '1px solid #f5f5f5' : 'none',
                        padding: '14px 16px',
                        fontSize: '14px',
                        backgroundColor: isSelected ? '#fff7ed' : undefined,
                        color: isSelected ? '#f97316' : undefined,
                        fontWeight: isSelected ? 'bold' : undefined,
                      }}
                    />
                  )
                })}
              </Cell.Group>
            </ScrollView>
          </View>
        </View>
      )}
    </>
  )
}
