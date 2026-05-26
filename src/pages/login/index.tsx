import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Marshalling, Eye } from '@nutui/icons-react-taro'
import { Button, Image } from '@nutui/nutui-react-taro'
import { login } from '@/api/login'
import LOGO from '@/assets/images/logo.png'
import { validateLogin } from '@/schemas/user'
// import { useUserStore, waitForHydration } from '@/store/useUserStore'
import { useUserStore } from '@/store/useUserStore'

type LoginMode = 'wechat' | 'account'

export default function Login() {
  const [mode, setMode] = useState<LoginMode>('wechat')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const {
    setAccessToken,
    setRefreshToken,
    setAccessExpireTime,
    setRefreshExpireTime,
    setUserInfo,
  } = useUserStore()

  useEffect(() => {
    // waitForHydration.then(() => {
    const token = useUserStore.getState().accessToken
    if (token) {
      Taro.switchTab({ url: '/pages/chat/index' })
    }
    // })
  }, [])

  const handleWechatLogin = async () => {
    const MAX_RETRY = 2
    for (let i = 0; i <= MAX_RETRY; i++) {
      try {
        // 每次重试都重新获取 code，避免 code 过期
        const { code } = await Taro.login()
        const res = await login({ login_type: 'wechat', code, account: '', password: '' })
        setAccessToken(res.accessToken)
        setRefreshToken(res.refreshToken)
        setAccessExpireTime(res.accessExpire)
        setRefreshExpireTime(res.refreshExpire)
        setUserInfo(res.userInfo)
        Taro.switchTab({ url: '/pages/chat/index' })
        return
      } catch (err: any) {
        // 最后一次重试失败，显示错误提示
        if (i === MAX_RETRY) {
          Taro.showToast({ title: err?.message || '微信登录失败，请重试', icon: 'none' })
        }
      }
    }
  }

  const handleAccountLogin = async () => {
    const error = validateLogin({ account, password })
    if (error) {
      Taro.showToast({ title: error, icon: 'none' })
      return
    }

    try {
      const res = await login({ login_type: 'account', code: '', account, password })
      setAccessToken(res.accessToken)
      setRefreshToken(res.refreshToken)
      setAccessExpireTime(res.accessExpire)
      setRefreshExpireTime(res.refreshExpire)
      setUserInfo(res.userInfo)
      Taro.switchTab({ url: '/pages/chat/index' })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '登录失败，请重试', icon: 'none' })
    }
  }

  return (
    <View className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
      <View className="mb-3">
        <Image src={LOGO} width={200} height={200} />
      </View>

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
          <View className="mb-4">
            <Input
              placeholder="请输入账号"
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

          <View className="mb-4" style={{ position: 'relative' }}>
            <Input
              placeholder="请输入密码"
              placeholderClass="text-gray-400"
              password={!showPassword}
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              className="text-sm pl-6 pr-9 py-3"
              style={{
                border: '2px solid #333',
                borderRadius: '24px',
              }}
            />
            <View
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '24rpx',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '36rpx',
                lineHeight: 1,
              }}
            >
              <Text>{showPassword ? <Eye /> : <Marshalling />}</Text>
            </View>
          </View>

          <Button
            color="var(--gradient-orange)"
            type="primary"
            size="large"
            className="w-full mb-4"
            onClick={handleAccountLogin}
          >
            登录
          </Button>

          <View className="text-center mt-1">
            <Text className="text-xs text-gray-6 underline" onClick={() => setMode('wechat')}>
              返回微信登录
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
