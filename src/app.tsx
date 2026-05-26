import { useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { refreshTokenIfNeeded, getStoredState } from '@/services/http'
import { ws } from '@/services/ws'
import 'dayjs/locale/zh-cn'
import './app.scss'

function App({ children }) {
  dayjs.locale('zh-cn')
  dayjs.extend(relativeTime)

  useEffect(() => {}, [])

  // 后台时断开 WebSocket
  useDidHide(() => {
    ws.disconnect()
  })

  // 切回前台：刷新 token + 连接 WebSocket
  useDidShow(async () => {
    await refreshTokenIfNeeded()
    const { accessToken, userInfo } = getStoredState()
    if (accessToken && userInfo?.account && !ws.connected) {
      ws.connect(accessToken, userInfo.account)
    }
  })

  return <View>{children}</View>
}

export default App
