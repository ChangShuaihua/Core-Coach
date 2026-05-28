import { useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { refreshTokenIfNeeded } from '@/services/http'
import 'dayjs/locale/zh-cn'
import './app.scss'

function App({ children }) {
  dayjs.locale('zh-cn')
  dayjs.extend(relativeTime)

  useEffect(() => {}, [])

  useDidHide(() => {})

  // 后台切回前台时主动刷新 token
  // 如果 accessToken 和 refreshToken 都过期，会自动跳转登录页
  useDidShow(() => {
    refreshTokenIfNeeded()
  })

  return <View>{children}</View>
}

export default App
