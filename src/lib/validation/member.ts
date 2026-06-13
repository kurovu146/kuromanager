import { z } from 'zod'

export const addMemberSchema = z.object({
  email: z.email('Email không hợp lệ'),
  fullName: z.string().optional(),
  role: z.enum(['admin', 'member']),
})

export type AddMemberInput = z.infer<typeof addMemberSchema>
