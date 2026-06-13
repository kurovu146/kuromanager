import { z } from 'zod'

export const signInSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(1, 'Nhập tên'),
  token: z.string().optional(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
