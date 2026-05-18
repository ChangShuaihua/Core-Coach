import type { PropsWithChildren } from 'react'
import { View } from '@tarojs/components'

interface CardProps extends PropsWithChildren {
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <View
      className={`overflow-hidden rounded-2xl bg-white shadow-md ${className}`}
      onClick={onClick}
    >
      {children}
    </View>
  )
}
