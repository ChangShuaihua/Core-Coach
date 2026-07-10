import { useEffect } from 'react'
import Taro, { useShareAppMessage, useShareTimeline as useTimelineHook } from '@tarojs/taro'

/**
 * 注册微信「转发给朋友」并显式开启分享菜单
 *
 * 两个步骤缺一不可：
 * 1. showShareMenu —— 控制「...」菜单里是否显示分享选项
 * 2. useShareAppMessage —— 注册转发时的回调，生成标题和路径
 *
 * @param title 分享标题
 * @param path 分享跳转路径
 */
export function useShare(title: string, path: string) {
  useShareAppMessage(() => ({
    title,
    path,
  }))
}

/**
 * 注册微信「分享到朋友圈」并开启对应菜单（仅非 Tab 页有效）
 *
 * 注意：showShareItems 必须在 showShareMenu 中显式声明，
 * 否则微信「...」菜单不会显示「分享到朋友圈」选项。
 *
 * @param title 分享标题
 * @param query 页面 query 参数（如 'a=1&b=2'），默认空串
 */
export function useShareTimeline(title: string, query = '') {
  useEffect(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      showShareItems: ['shareAppMessage', 'shareTimeline'],
    })
  }, [])

  useTimelineHook(() => ({
    title,
    query,
  }))
}

/**
 * 复制小程序页面路径到剪贴板
 * @param path 页面路径（如 '/pages/chat/index'）
 */
export function copyShareLink(path: string) {
  Taro.setClipboardData({
    data: path,
    success: () => {
      Taro.showToast({ title: '链接已复制', icon: 'success' })
    },
  })
}
