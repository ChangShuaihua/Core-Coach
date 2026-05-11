// 示例代码
import { z } from 'zod'

export const loginSchema = z.object({
  phone: z.string().min(11, '手机号不能少于11位').max(11, '手机号不能超过11位'),
  password: z.string().min(6, '密码不能少于6位'),
})

export type LoginFormData = z.infer<typeof loginSchema>
