export interface LoginFormData {
  account: string
  password: string
}

/**
 * 校验登录表单，返回第一个错误信息，通过返回 null
 */
export function validateLogin(data: LoginFormData): string | null {
  if (!data.account) return '请输入账号'
  if (data.account.length < 8) return '账号必须大于8位'
  if (!/^[a-zA-Z0-9]+$/.test(data.account)) return '账号仅限数字和字母'
  if (!data.password) return '请输入密码'
  if (data.password.length < 6) return '密码不能少于6位'
  if (data.password.length > 18) return '密码不能超过18位'
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(data.password))
    return '密码包含非法字符'
  return null
}
