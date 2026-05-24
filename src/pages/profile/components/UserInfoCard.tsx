import { View, Text, Image } from '@tarojs/components'
import defaultAvatar from '@/assets/images/avatar.png'
import type { UserInfo } from '@/types/profile'

interface UserInfoCardProps {
  userInfo: UserInfo
}

export default function UserInfoCard({ userInfo }: UserInfoCardProps) {
  return (
    <View className="flex flex-col items-center px-5 py-5">
      {/* 头像 */}
      <Image
        src={userInfo.avatar || defaultAvatar}
        className="w-16 h-16 rounded-full"
        mode="aspectFill"
      />

      {/* 昵称 */}
      <Text className="my-2 text-lg font-semibold">{userInfo.nickname}</Text>

      {/* UID */}
      <Text className="text-sm text-gray-4">UID:{userInfo.uid}</Text>
    </View>
  )
}
