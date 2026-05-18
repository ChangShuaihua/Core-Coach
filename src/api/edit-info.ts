export interface UserInfo {
  nickname: string
  avatar: string
}

const mockUserInfo: UserInfo = {
  nickname: '跑酷教练大鹏',
  avatar: '',
}

const useMock = true

const BASE_URL = '/api'

export async function getUserInfo(): Promise<UserInfo> {
  if (useMock) {
    return Promise.resolve(mockUserInfo)
  }

  const response = await fetch(`${BASE_URL}/user/info`)
  return response.json()
}

export async function updateUserInfo(nickname: string, avatar?: string): Promise<void> {
  if (useMock) {
    mockUserInfo.nickname = nickname
    if (avatar !== undefined) {
      mockUserInfo.avatar = avatar
    }
    return Promise.resolve()
  }

  await fetch(`${BASE_URL}/user/info`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname, avatar }),
  })
}

export async function uploadAvatar(filePath: string): Promise<string> {
  if (useMock) {
    mockUserInfo.avatar = filePath
    return Promise.resolve(filePath)
  }

  const response = await fetch(`${BASE_URL}/upload/avatar`, {
    method: 'POST',
    body: JSON.stringify({ filePath }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await response.json()
  return data.url
}
