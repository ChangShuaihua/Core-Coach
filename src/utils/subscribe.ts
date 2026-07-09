import Taro from '@tarojs/taro'

const SUBSCRIBE_TMPL_IDS = {
  TASK_COMPLETE: '1V1F8C_45El-vPGNUB4WyM7NH6CiD6wK--UGUSdqT2Q',
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
    console.log('开始请求订阅消息，模板ID:', ids)
    Taro.requestSubscribeMessage({
      tmplIds: ids,
      entityIds: [], // Taro 类型定义 Bug，传空数组消警告，微信运行时会忽略
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      },
      complete: (res) => {
        reject(res)
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
