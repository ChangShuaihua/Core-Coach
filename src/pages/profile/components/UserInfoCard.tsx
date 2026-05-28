import { View, Text } from '@tarojs/components'
import { Avatar } from '@nutui/nutui-react-taro'
import defaultAvatar from '@/assets/images/avatar.png'
import type { UserInfo } from '@/types/profile'

interface UserInfoCardProps {
  userInfo: UserInfo
}

export default function UserInfoCard({ userInfo }: UserInfoCardProps) {
  return (
    <View
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* 头像 */}
      <Avatar size="large" src={userInfo.avatarUrl || defaultAvatar} />

      {/* 昵称 */}
      <Text className="my-2 text-lg font-semibold">{userInfo.nickName}</Text>

      {/* 账号 */}
      <Text className="text-sm text-gray-4">UID:{userInfo.account}</Text>
    </View>
  )
}
