import { z } from 'zod'
import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '@/lib/issue-meta'

export const createIssueSchema = z.object({
  title: z.string().min(1, 'Nhập tiêu đề'),
  type: z.enum(ISSUE_TYPES),
  priority: z.enum(ISSUE_PRIORITIES),
  description: z.string().optional(),
})

export const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(ISSUE_TYPES).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  story_points: z.number().int().min(0).nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  sprint_id: z.string().uuid().nullable().optional(),
  rank: z.number().optional(),
})

export type CreateIssueInput = z.infer<typeof createIssueSchema>
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>
