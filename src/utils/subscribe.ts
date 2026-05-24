import Taro from '@tarojs/taro'

// 订阅消息模板ID（从微信公众平台获取）
const SUBSCRIBE_TMPL_IDS = {
  TASK_COMPLETE: 'qdxiOA3uXl4Y-MTffH-glx0EUz3rKbIcPIMp06YtRy0',
}

/**
 * 请求订阅消息授权（必须在用户点击事件的同步上下文中调用）
 */
export async function requestSubscribe(tmplIds?: string[]): Promise<boolean> {
  const ids = tmplIds || Object.values(SUBSCRIBE_TMPL_IDS).filter(Boolean)

  if (ids.length === 0) {
    console.warn('没有配置订阅消息模板ID')
    return false
  }

  console.log('请求订阅的模板IDs:', ids)

  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: ids,
      entityIds: ids,
      fail: (err: any) => {
        console.error('订阅消息API调用失败详情:', err)
      },
    })

    console.log('订阅消息API返回:', res)

    // 检查是否至少有一个模板被接受
    const accepted = ids.some((id) => res[id] === 'accept')
    console.log('用户是否接受:', accepted)
    return accepted
  } catch (error: any) {
    console.error('请求订阅消息失败:', error)
    // 如果提示 "can only be invoked by user TAP gesture"，说明调用时机不对
    if (error?.errMsg?.includes('TAP gesture')) {
      console.error('>>> 调用时机问题：必须在用户点击事件的同步上下文中调用 <<<')
    }
    return false
  }
}

/**
 * 请求任务完成通知的订阅
 */
export function requestTaskCompleteSubscribe(): Promise<boolean> {
  return requestSubscribe([SUBSCRIBE_TMPL_IDS.TASK_COMPLETE])
}
