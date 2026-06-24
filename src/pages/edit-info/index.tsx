import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Edit, ArrowLeft } from '@nutui/icons-react-taro'
import { Avatar, Button } from '@nutui/nutui-react-taro'
import { updateUserInfo, uploadAvatar } from '@/api/edit-info'
import defaultAvatar from '@/assets/images/avatar.png'
import Card from '@/components/Card'
import Layout from '@/components/Layout'
import { useUserStore } from '@/store/useUserStore'

export default function EditInfoPage() {
  const { userInfo, setUserInfo } = useUserStore()
  const [nickname, setNickname] = useState(userInfo?.nickName ?? '')
  const [avatar, setAvatar] = useState(userInfo?.avatarUrl ?? '')

  const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]

        // 前端预检查文件大小
        try {
          const fileInfo = await Taro.getFileInfo({ filePath: tempFilePath })
          if ('size' in fileInfo && fileInfo.size > MAX_AVATAR_SIZE) {
            Taro.showToast({
              title: '图片过大，请压缩后重试（最大2MB）',
              icon: 'none',
              duration: 2000,
            })
            return
          }
        } catch {
          // 获取文件信息失败，继续上传让后端处理
        }

        try {
          Taro.showLoading({ title: '上传中...' })
          const result = await uploadAvatar(tempFilePath)
          setAvatar(result.file_url)
          Taro.hideLoading()
          Taro.showToast({ title: '上传成功', icon: 'success' })
        } catch (error: any) {
          Taro.hideLoading()
          // 捕获 413 错误并给出具体提示
          if (error?.statusCode === 413) {
            Taro.showToast({
              title: '图片过大，请压缩后重试（最大2MB）',
              icon: 'none',
              duration: 2000,
            })
          } else {
            Taro.showToast({ title: '上传失败', icon: 'none' })
          }
          console.error('上传头像失败:', error)
        }
      },
    })
  }

  const handleNicknameClick = () => {
    Taro.showModal({
      title: '修改昵称',
      editable: true as unknown as boolean,
      placeholderText: '请输入昵称',
      success: (res: any) => {
        if (res.confirm && res.content && res.content.trim()) {
          setNickname(res.content.trim())
        }
      },
    } as unknown as Taro.showModal.Option)
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    Taro.showLoading({ title: '保存中...' })
    try {
      await updateUserInfo(nickname.trim(), avatar)
      // 同步回 store
      if (userInfo) {
        setUserInfo({ ...userInfo, nickName: nickname.trim(), avatarUrl: avatar })
      }
      Taro.hideLoading()
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '保存失败', icon: 'none' })
      console.error('保存失败:', error)
    }
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

        <Card className="mb-6">
          <View className="flex flex-row items-center justify-between px-4 py-4">
            <Text className="text-sm text-gray-8 mr-4">昵称</Text>
            <Text className="flex-1 text-sm text-right text-gray-8" onClick={handleNicknameClick}>
              {nickname || '请输入昵称'}
            </Text>
          </View>
        </Card>

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
