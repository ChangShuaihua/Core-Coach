import Taro from '@tarojs/taro'

const SUBSCRIBE_TMPL_IDS = {
  TASK_COMPLETE: 'qdxiOA3uXl4Y-MTffH-glx0EUz3rKbIcPIMp06YtRy0',
}

/**
 * 请求订阅消息授权，返回 Promise（用户操作完才 resolve/reject）
 */
export function requestSubscribe(tmplIds?: string[]): Promise<Record<string, string>> {
  const ids = tmplIds || Object.values(SUBSCRIBE_TMPL_IDS).filter(Boolean)

  if (ids.length === 0) {
    console.warn('没有配置订阅消息模板ID')
    return Promise.reject(new Error('没有配置订阅消息模板ID'))
  }

  return new Promise((resolve, reject) => {
    Taro.requestSubscribeMessage({
      tmplIds: ids,
      entityIds: ids,
      success: (res) => {
        console.log('订阅成功:', res)
        resolve(res)
      },
      fail: (err) => {
        console.error('订阅失败:', err)
        reject(err)
      },
    })
  })
}

/**
 * 请求任务完成通知的订阅
 */
export function requestTaskCompleteSubscribe(): Promise<Record<string, string>> {
  return requestSubscribe([SUBSCRIBE_TMPL_IDS.TASK_COMPLETE])
}
