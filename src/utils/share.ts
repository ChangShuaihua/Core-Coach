import type { MutableRefObject } from 'react'
import Taro, { useShareAppMessage, useShareTimeline as useTimelineHook } from '@tarojs/taro'

/**
 * 注册微信「转发给朋友」
 * @param title 分享标题（静态字符串）
 * @param path 分享跳转路径
 */
export function useShare(title: string, path: string) {
  useShareAppMessage(() => ({
    title,
    path,
  }))
}

/**
 * 注册微信「转发给朋友」（动态标题版）
 *
 * useShareAppMessage 在组件 mount 时注册回调，后续渲染不会更新闭包内的值。
 * 传入 ref 让回调执行时始终读取最新标题。
 *
 * @param titleRef 标题 ref（页面渲染时更新 ref.current，分享时读取）
 * @param path 分享跳转路径
 */
export function useShareRef(titleRef: MutableRefObject<string>, path: string) {
  useShareAppMessage(() => ({
    title: titleRef.current,
    path,
  }))
}

/**
 * 注册微信「分享到朋友圈」（仅非 Tab 页有效）
 *
 * 注意：需要配合页面中调用 showShareMenu 才能生效，
 * 如 useDidShow(() => { Taro.showShareMenu({ ... }) })
 *
 * @param title 分享标题（静态字符串）
 * @param query 页面 query 参数（如 'a=1&b=2'），默认空串
 */
export function useShareTimeline(title: string, query = '') {
  useTimelineHook(() => ({
    title,
    query,
  }))
}

/**
 * 注册微信「分享到朋友圈」（动态标题版）
 * @param titleRef 标题 ref
 * @param query 页面 query 参数
 */
export function useShareTimelineRef(titleRef: MutableRefObject<string>, query = '') {
  useTimelineHook(() => ({
    title: titleRef.current,
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
