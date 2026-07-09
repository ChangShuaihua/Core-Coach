import { useState, useRef, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { Popup, Form, Input, Button } from '@nutui/nutui-react-taro'
import { updatePassword, getEncryptedPassword } from '@/api/profile'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useRsaKeyStore } from '@/store/useRsaKeyStore'
import { useUserStore } from '@/store/useUserStore'
import { decryptWithPrivateKey } from '@/utils/crypto'

export default function AccountSettingsPage() {
  const { userInfo, setUserInfo } = useUserStore()
  const { isGenerating, ensureKeyPair } = useRsaKeyStore()
  const [showPopup, setShowPopup] = useState(false)
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [displayPassword, setDisplayPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    ensureKeyPair()
    return () => {
      useRsaKeyStore.getState().clearKeyPair()
    }
  }, [ensureKeyPair])

  const openPopup = () => {
    setPasswordData({ password: '', confirmPassword: '' })
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
  }

  const handleShowPassword = async () => {
    const { publicKeyPem, privateKeyPem } = useRsaKeyStore.getState()

    if (!publicKeyPem || !privateKeyPem) {
      Taro.showToast({ title: '密钥对未就绪，请稍候', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '获取中...' })
      const cipherText = await getEncryptedPassword(publicKeyPem)
      const plainPassword = decryptWithPrivateKey(cipherText, privateKeyPem)

      Taro.hideLoading()

      if (!plainPassword) {
        Taro.showToast({ title: '密码解密失败', icon: 'none' })
        return
      }

      setDisplayPassword(plainPassword)
      setShowPassword(true)

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        setDisplayPassword('')
        setShowPassword(false)
        timerRef.current = null
      }, 5000)
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: err?.message || '获取密码失败', icon: 'none' })
    }
  }

  const handleSubmit = async () => {
    const { password, confirmPassword } = passwordData
    if (!password) {
      Taro.showToast({ title: '请输入新密码', icon: 'none' })
      return
    }
    if (password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (!confirmPassword) {
      Taro.showToast({ title: '请输入确认密码', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码输入不一致', icon: 'none' })
      return
    }

    Taro.showLoading({ title: '保存中...' })
    try {
      const res = await updatePassword({ account: userInfo!.account, password })
      setUserInfo({ ...userInfo!, password: res.password })
      Taro.hideLoading()
      Taro.showToast({ title: '修改成功', icon: 'success' })
      closePopup()
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: err?.message || '修改失败', icon: 'none' })
      console.error('修改密码失败:', err)
    }
  }

  return (
    <Layout
      title="账号设置"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <View className="p-4">
        <Card>
          <View className="flex flex-row items-center justify-between px-4 py-4">
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-9">账号</Text>
            </View>
            <Text className="text-sm text-gray-400">{userInfo?.account || '暂无'}</Text>
          </View>

          <View className="bg-gray-100" style={{ height: '1px' }} />

          <View
            className="flex flex-row items-center justify-between px-4 py-4"
            hoverClass={isGenerating ? '' : 'bg-gray-50'}
            hoverStayTime={100}
            onClick={isGenerating ? undefined : handleShowPassword}
          >
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-9">密码</Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-8 mr-2">
                {isGenerating ? '密钥生成中...' : showPassword ? displayPassword : '点击查看密码'}
              </Text>
            </View>
          </View>

          <View className="bg-gray-100" style={{ height: '1px' }} />

          <View
            className="flex flex-row items-center justify-between px-4 py-4"
            hoverClass="bg-gray-50"
            hoverStayTime={100}
            onClick={openPopup}
          >
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-9">修改密码</Text>
            </View>
          </View>
        </Card>
      </View>

      <Popup
        visible={showPopup}
        position="bottom"
        round
        onClose={closePopup}
        style={{ minHeight: '360px' }}
      >
        <View className="p-4">
          <View className="flex flex-row items-center justify-center mb-4">
            <Text className="text-base text-gray-9">修改密码</Text>
          </View>

          <Form>
            <View className="mb-4">
              <Text className="text-sm text-gray-7 mb-2 block">新密码</Text>
              <View className="relative">
                <Input
                  value={passwordData.password}
                  type="text"
                  placeholder="请输入新密码"
                  maxLength={20}
                  onChange={(val) => setPasswordData((prev) => ({ ...prev, password: val }))}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-7 mb-2 block">确认密码</Text>
              <Input
                value={passwordData.confirmPassword}
                type="text"
                placeholder="请再次输入新密码"
                maxLength={20}
                onChange={(val) => setPasswordData((prev) => ({ ...prev, confirmPassword: val }))}
              />
            </View>
          </Form>

          <Button
            type="primary"
            size="large"
            color="var(--gradient-orange)"
            className="w-full"
            style={{ marginBottom: '12px' }}
            onClick={handleSubmit}
          >
            <Text className="text-base">确认修改</Text>
          </Button>

          <Button size="large" plain className="w-full" onClick={closePopup}>
            <Text className="text-base">取消</Text>
          </Button>
        </View>
      </Popup>
    </Layout>
  )
}
