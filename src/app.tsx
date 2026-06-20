import { useEffect } from 'react'
import { View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { refreshTokenIfNeeded, getStoredState, logoutAndRedirect } from '@/services/http'
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

    // 429 在线人数上限 → 强制登出
    const handleAuthFailed = (data: any) => {
      if (data?.code === 429) {
        logoutAndRedirect(data?.message || '当前账号在线人数已达上限')
      }
    }
    ws.on('auth_failed', handleAuthFailed)
    return () => {
      ws.off('auth_failed', handleAuthFailed)
    }
  }, [])

  // 切后台：通知后端
  useDidHide(() => {
    ws.send(
      'app_hide',
      { create_time: Math.floor(Date.now() / 1000) },
      { requireAuth: false, quiet: true }
    )
  })

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
