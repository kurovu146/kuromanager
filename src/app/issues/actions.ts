'use server'

import { createClient } from '@/lib/supabase/server'
import { createIssueSchema, updateIssueSchema } from '@/lib/validation/issue'

export type CreateIssueArgs = {
  projectId: string
  title: string
  type: string
  priority: string
  description?: string
  storyPoints?: number | null
  assigneeId?: string | null
  sprintId?: string | null
}

export async function createIssue(args: CreateIssueArgs) {
  const parsed = createIssueSchema.safeParse({
    title: args.title,
    type: args.type,
    priority: args.priority,
    description: args.description,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('create_issue', {
      p_project_id: args.projectId,
      p_title: parsed.data.title,
      p_type: parsed.data.type,
      p_priority: parsed.data.priority,
      p_description: parsed.data.description ?? null,
      p_story_points: args.storyPoints ?? null,
      p_assignee_id: args.assigneeId ?? null,
      p_sprint_id: args.sprintId ?? null,
    })
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function updateIssue(id: string, patch: Record<string, unknown>) {
  const parsed = updateIssueSchema.safeParse(patch)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('issues').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function deleteIssue(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('issues').delete().eq('id', id)
  if (error) {
    if (error.code === '42501') return { error: 'Chỉ người tạo hoặc admin được xóa issue' }
    return { error: error.message }
  }
  return {}
}
