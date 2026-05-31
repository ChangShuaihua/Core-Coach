import Taro from '@tarojs/taro'

/**
 * 注册微信分享
 * @param title 分享标题
 * @param path 分享跳转路径
 */
export function useShare(title: string, path: string) {
  Taro.useShareAppMessage(() => ({
    title,
    path,
  }))
}
