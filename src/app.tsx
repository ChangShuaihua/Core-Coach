import { useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import { QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { queryClient } from '@/lib/reactQuery'
import 'dayjs/locale/zh-cn'
import './app.scss'

function App({ children }) {
  dayjs.locale('zh-cn')
  dayjs.extend(relativeTime)

  // 可以使用所有的 React Hooks
  useEffect(() => {}, [])

  // 对应 onShow
  useDidShow(() => {})

  // 对应 onHide
  useDidHide(() => {})

  return (
    <QueryClientProvider client={queryClient}>
      <View>{children}</View>
    </QueryClientProvider>
  )
}

export default App
