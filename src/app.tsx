import { useEffect, useRef } from 'react'
import { View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { refreshTokenIfNeeded, getStoredState } from '@/services/http'
import { ws } from '@/services/ws'
import { initTaskWsHandlers, syncPendingAndEvents } from '@/store/taskWsHandler'
import 'dayjs/locale/zh-cn'
import './app.scss'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

const HIDE_DISCONNECT_DELAY = 3000

function App({ children }) {
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    ws.initNetworkListener()
    initTaskWsHandlers()
  }, [])

  // 后台时延迟断开（避免 previewImage 等原生组件触发误断开）
  useDidHide(() => {
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null
      ws.disconnect()
    }, HIDE_DISCONNECT_DELAY)
  })

  // 切回前台
  useDidShow(async () => {
    // 还在延迟期内 → 只是打开了原生组件（如 previewImage），取消断开
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
      return
    }

    // 已经断开 → 正常重连
    const success = await refreshTokenIfNeeded()
    if (!success) return
    const { accessToken } = getStoredState()
    if (accessToken && !ws.connected) {
      ws.connect(accessToken)
    }

    // 同步进行中任务状态 + 补拉漏消息
    syncPendingAndEvents()
  })

  return <View>{children}</View>
}

export default App
