export interface AccountInfo {
  phone: string
  password?: string
}

const mockAccount: AccountInfo = {
  phone: '189536545515',
  password: '123456',
}

// 是否使用模拟数据
const useMock = true

// API 基础地址 - 到时候只需要修改这里即可
const BASE_URL = '/api'

export async function getAccountInfo(): Promise<AccountInfo> {
  if (useMock) {
    return Promise.resolve(mockAccount)
  }

  const response = await fetch(`${BASE_URL}/account`)
  return response.json()
}

export async function updatePassword(newPassword: string): Promise<void> {
  if (useMock) {
    mockAccount.password = newPassword
    return Promise.resolve()
  }

  await fetch(`${BASE_URL}/account/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  })
}
