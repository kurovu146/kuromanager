import { z } from 'zod'

export const inviteSchema = z.object({
  email: z.email('Email không hợp lệ'),
  role: z.enum(['admin', 'member']),
})

export type InviteInput = z.infer<typeof inviteSchema>
