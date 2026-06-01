import { useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { refreshTokenIfNeeded, getStoredState } from '@/services/http'
import { ws } from '@/services/ws'
import { initTaskWsHandlers } from '@/store/taskWsHandler'
import 'dayjs/locale/zh-cn'
import './app.scss'

function App({ children }) {
  dayjs.locale('zh-cn')
  dayjs.extend(relativeTime)

  useEffect(() => {
    ws.initNetworkListener()
    initTaskWsHandlers()
  }, [])

  // 后台时断开 WebSocket
  useDidHide(() => {
    ws.disconnect()
  })

  // 切回前台：刷新 token + 连接 WebSocket
  useDidShow(async () => {
    await refreshTokenIfNeeded()
    const { accessToken } = getStoredState()
    if (accessToken && !ws.connected) {
      ws.connect(accessToken)
    }
  })

  return <View>{children}</View>
}

export default App
