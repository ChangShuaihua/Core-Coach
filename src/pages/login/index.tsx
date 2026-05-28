import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Marshalling, Eye } from '@nutui/icons-react-taro'
import { Button, Image, Avatar, Popup } from '@nutui/nutui-react-taro'
import { uploadAvatar, updateUserInfo } from '@/api/edit-info'
import { login } from '@/api/login'
import defaultAvatar from '@/assets/images/avatar.png'
import LOGO from '@/assets/images/logo.png'
import { validateLogin } from '@/schemas/user'
import { useUserStore, waitForHydration } from '@/store/useUserStore'

type LoginMode = 'wechat' | 'account'

export default function Login() {
  const [mode, setMode] = useState<LoginMode>('wechat')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('')
  const {
    setAccessToken,
    setRefreshToken,
    setAccessExpireTime,
    setRefreshExpireTime,
    setUserInfo,
  } = useUserStore()

  useEffect(() => {
    waitForHydration.then(() => {
      const token = useUserStore.getState().accessToken
      if (token) {
        Taro.switchTab({ url: '/pages/chat/index' })
      }
    })
  }, [])

  // 登录成功后判断是否需要完善资料
  const afterLogin = (userInfo: any) => {
    // TODO: 测试完改回 if (!userInfo.nickName)
    setNickname(userInfo.nickName || '')
    setAvatar(userInfo.avatarUrl || '')
    setShowProfilePopup(true)
  }

  // 微信官方 chooseAvatar
  const handleChooseAvatar = async (e: any) => {
    const tempFilePath = e.detail.avatarUrl
    if (!tempFilePath) return
    try {
      Taro.showLoading({ title: '上传中...' })
      const uploadedUrl = await uploadAvatar(tempFilePath)
      setAvatar(uploadedUrl)
      Taro.hideLoading()
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '头像上传失败', icon: 'none' })
    }
  }

  // 保存资料
  const handleSaveProfile = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    try {
      Taro.showLoading({ title: '保存中...' })
      await updateUserInfo(nickname.trim(), avatar)
      // 同步到 store
      const currentUser = useUserStore.getState().userInfo
      if (currentUser) {
        setUserInfo({ ...currentUser, nickName: nickname.trim(), avatarUrl: avatar })
      }
      Taro.hideLoading()
      setShowProfilePopup(false)
      Taro.switchTab({ url: '/pages/chat/index' })
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  // 跳过填写
  const handleSkipProfile = () => {
    setShowProfilePopup(false)
    Taro.switchTab({ url: '/pages/chat/index' })
  }

  const handleWechatLogin = async () => {
    const MAX_RETRY = 2
    for (let i = 0; i <= MAX_RETRY; i++) {
      try {
        const { code } = await Taro.login()
        const res = await login({ login_type: 'wechat', code, account: '', password: '' })
        setAccessToken(res.accessToken)
        setRefreshToken(res.refreshToken)
        setAccessExpireTime(res.accessExpire)
        setRefreshExpireTime(res.refreshExpire)
        setUserInfo(res.userInfo)
        afterLogin(res.userInfo)
        return
      } catch (err: any) {
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
      afterLogin(res.userInfo)
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

      {/* 完善资料弹窗 */}
      <Popup
        visible={showProfilePopup}
        position="bottom"
        round
        closeable
        onClose={handleSkipProfile}
        style={{ minHeight: '400px' }}
      >
        <View className="p-6">
          <Text className="text-lg font-medium text-center block mb-6">完善个人资料</Text>

          {/* 头像选择 */}
          <View className="flex flex-col items-center mb-6">
            <Button
              openType="chooseAvatar"
              onChooseAvatar={handleChooseAvatar}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0,
                lineHeight: 'normal',
              }}
            >
              <Avatar size="large" src={avatar || defaultAvatar} />
            </Button>
            <Text className="text-xs text-gray-400 mt-2">点击选择头像</Text>
          </View>

          {/* 昵称输入 */}
          <View className="mb-6">
            <Text className="text-sm text-gray-7 mb-2 block">昵称</Text>
            <Input
              type="nickname"
              placeholder="请输入昵称"
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              className="text-sm px-4 py-3"
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
              }}
            />
          </View>

          <Button
            type="primary"
            size="large"
            color="var(--gradient-orange)"
            className="w-full mb-3"
            onClick={handleSaveProfile}
          >
            <Text className="text-base">保存</Text>
          </Button>

          <View className="text-center">
            <Text className="text-sm text-gray-400" onClick={handleSkipProfile}>
              暂时跳过
            </Text>
          </View>
        </View>
      </Popup>
    </View>
  )
}
