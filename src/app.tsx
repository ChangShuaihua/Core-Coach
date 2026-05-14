import { useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
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

  return <View>{children}</View>
}

export default App
