import { z } from 'zod'

export const signInSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirm'],
  })

export type SignInInput = z.infer<typeof signInSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
