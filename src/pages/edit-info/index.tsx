import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Edit, ArrowLeft } from '@nutui/icons-react-taro'
import { Avatar, Button } from '@nutui/nutui-react-taro'
import defaultAvatar from '@/assets/images/avatar.png'
import Card from '@/components/Card'
import Layout from '@/components/Layout'

export default function EditInfoPage() {
  const [nickname, setNickname] = useState('跑酷教练大鹏')
  const [avatar, setAvatar] = useState('')

  // 选择头像
  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setAvatar(res.tempFilePaths[0])
      },
    })
  }

  // 保存
  const handleSave = () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    Taro.showLoading({ title: '保存中...' })
    // TODO: 调用保存接口
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    }, 1000)
  }

  return (
    <Layout
      title="编辑资料"
      showTabBar={false}
      renderLeft={
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft />
        </View>
      }
    >
      <View className="p-4">
        {/* 头像区域 */}
        <Card className="mb-4">
          <View className="flex flex-row items-center justify-between px-4 py-4">
            <Text className="text-sm text-gray-8">头像</Text>
            <View className="flex flex-row items-center">
              <View className="relative" onClick={handleChooseAvatar}>
                <Avatar size="large" src={avatar || defaultAvatar} />
                <View
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                >
                  <Edit size={12} color="#fff" />
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* 昵称区域 */}
        <Card className="mb-6">
          <View className="flex flex-row items-center justify-between px-4 py-4">
            <Text className="text-sm text-gray-8 mr-4">昵称</Text>
            <Input
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              placeholder="请输入昵称"
              placeholderClass="text-gray-400"
              maxlength={20}
              className="flex-1 text-sm text-right text-gray-8"
            />
          </View>
        </Card>

        {/* 保存按钮 */}
        <Button
          type="primary"
          size="large"
          color="var(--gradient-orange)"
          className="w-full"
          onClick={handleSave}
        >
          <Text className="text-base font-medium">保存</Text>
        </Button>
      </View>
    </Layout>
  )
}
