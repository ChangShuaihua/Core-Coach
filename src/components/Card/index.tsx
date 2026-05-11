import type { PropsWithChildren } from 'react'
import { View } from '@tarojs/components'

interface CardProps extends PropsWithChildren {
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`overflow-hidden rounded-2xl bg-white shadow-md ${className}`}>
      {children}
    </View>
  )
}
