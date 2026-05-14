import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from '@nutui/icons-react-taro'
import { Popup, Form, Input, Button } from '@nutui/nutui-react-taro'
import Card from '@/components/Card'
import Layout from '@/components/Layout'

export default function AccountSettingsPage() {
  const [showPopup, setShowPopup] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
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

  const handleSubmit = () => {
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
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showToast({ title: '修改成功', icon: 'success' })
      closePopup()
    }, 1000)
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
            <Text className="text-sm text-gray-400">189536545515</Text>
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
              <Text className="text-sm text-gray-8 mr-2">{currentPassword || '暂未设置密码'}</Text>
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
