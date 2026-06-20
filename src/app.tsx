import { useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { refreshTokenIfNeeded, getStoredState } from '@/services/http'
import { ws } from '@/services/ws'
import { initTaskWsHandlers, syncPendingAndEvents } from '@/store/taskWsHandler'
import 'dayjs/locale/zh-cn'
import './app.scss'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

function App({ children }) {
  useEffect(() => {
    ws.initNetworkListener()
    initTaskWsHandlers()
  }, [])

  // 切回前台：验证连接 + 补偿数据
  useDidShow(async () => {
    const success = await refreshTokenIfNeeded()
    if (!success) return

    const { accessToken } = getStoredState()
    if (accessToken) {
      if (!ws.connected) {
        ws.connect(accessToken)
      } else {
        ws.ensureAlive()
      }
    }

    syncPendingAndEvents()
  })

  return <View>{children}</View>
}

export default App
