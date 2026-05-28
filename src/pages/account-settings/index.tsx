import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { Popup, Form, Input, Button } from '@nutui/nutui-react-taro'
import { updatePassword } from '@/api/profile'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useUserStore } from '@/store/useUserStore'

export default function AccountSettingsPage() {
  const { userInfo, setUserInfo } = useUserStore()
  const [showPopup, setShowPopup] = useState(false)
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  })

  const openPopup = () => {
    setPasswordData({ password: '', confirmPassword: '' })
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
  }

  const validatePassword = (password: string): string | null => {
    if (!password) return '请输入新密码'
    if (password.length < 6) return '密码不能少于6位'
    if (password.length > 18) return '密码不能超过18位'
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(password))
      return '密码包含非法字符'
    return null
  }

  const handleSubmit = async () => {
    const { password, confirmPassword } = passwordData

    const validationError = validatePassword(password)
    if (validationError) {
      Taro.showToast({ title: validationError, icon: 'none' })
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
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '修改失败', icon: 'none' })
      console.error('修改密码失败:', error)
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
            hoverClass="bg-gray-50"
            hoverStayTime={100}
            onClick={openPopup}
          >
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-9">密码</Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-8 mr-2">
                {userInfo?.password || '暂未设置密码'}
              </Text>
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
                  placeholder="请输入新密码（6-18位字母、数字或特殊字符）"
                  maxLength={18}
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
                maxLength={18}
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
