import type { PropsWithChildren } from 'react'
import { View } from '@tarojs/components'

interface CardProps extends PropsWithChildren {
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Card({ children, className = '', style, onClick }: CardProps) {
  return (
    <View
      className={`overflow-hidden rounded-2xl bg-white shadow-md ${className}`}
      style={style}
      onClick={onClick}
      onTap={onClick}
    >
      {children}
    </View>
  )
}
