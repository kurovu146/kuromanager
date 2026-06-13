import { z } from 'zod'

export const createSprintSchema = z.object({
  name: z.string().min(1, 'Nhập tên sprint'),
  goal: z.string().optional(),
})

export type CreateSprintInput = z.infer<typeof createSprintSchema>
