import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nhập tên project'),
  key: z.string().regex(/^[A-Z0-9]{2,10}$/, 'Key in hoa, 2-10 ký tự'),
  description: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
