import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Card from '@/components/Card'

export interface UploadConfig {
  step: number
  title: string
  accept?: string
  maxSize?: number
  required?: boolean
}

interface UploadComponentProps {
  config: UploadConfig
  value: any
  onChange: (value: string) => void
}

/**
 * UploadComponent - 文件上传组件
 *
 * 用于处理 type: 'upload' 的步骤
 */
export default function UploadComponent({ config, value, onChange }: UploadComponentProps) {
  const fieldKey = `step_${config.step}`
  const currentValue = value[fieldKey] || ''
  const [uploading, setUploading] = useState(false)

  const handleChooseImage = async () => {
    try {
      setUploading(true)
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const tempFilePath = res.tempFilePaths[0]

        // 这里可以上传到服务器
        // const uploadRes = await uploadToServer(tempFilePath)
        // onChange(uploadRes.url)

        // 暂时使用本地路径
        onChange(tempFilePath)

        Taro.showToast({
          title: '上传成功',
          icon: 'success',
          duration: 2000,
        })
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      Taro.showToast({
        title: '选择图片失败',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <Card className="p-6">
      <Text className="text-lg font-semibold mb-4 block">{config.title}</Text>

      {!currentValue ? (
        <View
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition"
          onClick={handleChooseImage}
        >
          <Text className="text-4xl mb-2">📤</Text>
          <Text className="text-sm text-gray-600 mb-1">
            {uploading ? '上传中...' : '点击上传图片'}
          </Text>
          <Text className="text-xs text-gray-400">
            支持 JPG、PNG 格式，大小不超过 {config.maxSize || 5}MB
          </Text>
        </View>
      ) : (
        <View className="relative">
          <Image
            src={currentValue}
            className="w-full h-48 object-cover rounded-lg"
            mode="aspectFill"
          />
          <View className="absolute top-2 right-2 flex gap-2">
            <View
              className="bg-white rounded-full p-2 shadow-lg cursor-pointer"
              onClick={handleChooseImage}
            >
              <Text className="text-sm">🔄</Text>
            </View>
            <View
              className="bg-white rounded-full p-2 shadow-lg cursor-pointer"
              onClick={handleRemove}
            >
              <Text className="text-sm">🗑️</Text>
            </View>
          </View>
        </View>
      )}
    </Card>
  )
}
