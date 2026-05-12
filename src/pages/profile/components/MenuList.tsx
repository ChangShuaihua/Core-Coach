import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import { Cell } from '@nutui/nutui-react-taro'
import type { MenuGroup } from '../types'

interface MenuListProps {
  menuGroup: MenuGroup
}

export default function MenuList({ menuGroup }: MenuListProps) {
  return (
    <Cell.Group>
      {menuGroup.items.map((item) => {
        const handleClick = () => {
          if (item.onClick) {
            item.onClick()
          } else if (item.path) {
            Taro.navigateTo({ url: item.path })
          }
        }

        return (
          <Cell
            key={item.id}
            title={
              <View className="flex flex-row items-center">
                <View className="mr-3">{item.icon}</View>
                <View style={{ color: item.iconColor === '#ee0a24' ? '#ee0a24' : '#323233' }}>
                  {item.title}
                </View>
              </View>
            }
            clickable
            extra={<ArrowRight size={16} color="#c8c9cc" />}
            onClick={handleClick}
          />
        )
      })}
    </Cell.Group>
  )
}
