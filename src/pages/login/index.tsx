import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Image } from '@nutui/nutui-react-taro'
import LOGO from '@/assets/images/logo.png'
import { useUserStore } from '@/store/useUserStore'

type LoginMode = 'wechat' | 'account'

export default function Login() {
  const [mode, setMode] = useState<LoginMode>('wechat')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const { setToken } = useUserStore()

  // 微信登录
  const handleWechatLogin = () => {
    Taro.showLoading({ title: '登录中...' })
    // TODO: 调用微信登录接口
    setTimeout(() => {
      Taro.hideLoading()
      setToken('mock-token')
      Taro.switchTab({ url: '/pages/chat/index' })
    }, 1000)
  }

  // 账号密码登录
  const handleAccountLogin = () => {
    if (!account.trim()) {
      Taro.showToast({ title: '请输入账号或邮箱', icon: 'none' })
      return
    }
    if (!password.trim()) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    Taro.showLoading({ title: '登录中...' })
    // TODO: 调用账号密码登录接口
    setTimeout(() => {
      Taro.hideLoading()
      setToken('mock-token')
      Taro.switchTab({ url: '/pages/chat/index' })
    }, 1000)
  }

  // 忘记密码
  const handleForgotPassword = () => {
    Taro.showToast({ title: '请联系管理员重置密码', icon: 'none' })
  }

  return (
    <View className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
      {/* Logo/图片 */}
      <View className="mb-5">
        <Image src={LOGO} width={200} height={200} />
      </View>

      {/* 微信登录模式 */}
      {mode === 'wechat' && (
        <View className="w-full">
          {/* 微信登录按钮 */}
          <Button
            type="primary"
            size="large"
            color="var(--gradient-orange)"
            className="w-full mb-4"
            onClick={handleWechatLogin}
          >
            <View className="flex flex-row items-center justify-center">
              <Text className="text-base font-medium">微信登录</Text>
            </View>
          </Button>

          {/* 切换到账号密码登录 */}
          <View className="text-center mt-1">
            <Text className="text-xs text-gray-6 underline" onClick={() => setMode('account')}>
              账号密码登录
            </Text>
          </View>
        </View>
      )}

      {/* 账号密码登录模式 */}
      {mode === 'account' && (
        <View className="w-full">
          {/* 账号输入框 */}
          <View className="mb-4">
            <Input
              placeholder="请输入账号或邮箱"
              placeholderClass="text-gray-400"
              value={account}
              onInput={(e) => setAccount(e.detail.value)}
              className="text-sm px-6 py-3"
              style={{
                border: '2px solid #333',
                borderRadius: '24px',
              }}
            />
          </View>

          {/* 密码输入框 */}
          <View className="mb-4">
            <Input
              placeholder="请输入密码"
              placeholderClass="text-gray-400"
              password
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              className="text-sm px-6 py-3"
              style={{
                border: '2px solid #333',
                borderRadius: '24px',
              }}
            />
          </View>

          {/* 登录按钮 */}
          <Button
            color="var(--gradient-orange)"
            type="primary"
            size="large"
            className="w-full mb-4"
            onClick={handleAccountLogin}
          >
            登录
          </Button>

          {/* 底部链接 */}
          <View className="flex flex-row items-center justify-center gap-4 mt-2">
            <Text className="text-xs text-gray-6 underline" onClick={handleForgotPassword}>
              忘记密码
            </Text>
            <Text className="text-xs text-gray-6">|</Text>
            <Text className="text-xs text-gray-6 underline" onClick={() => setMode('wechat')}>
              返回微信登录
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
