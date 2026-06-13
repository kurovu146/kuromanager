'use server'

import { createClient } from '@/lib/supabase/server'
import { createSprintSchema } from '@/lib/validation/sprint'

export async function createSprint(projectId: string, input: { name: string; goal?: string }) {
  const parsed = createSprintSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sprints')
    .insert({ project_id: projectId, name: parsed.data.name, goal: parsed.data.goal ?? null })
    .select()
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function startSprint(sprintId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('start_sprint', { p_sprint_id: sprintId })
  if (error) {
    if (error.code === '23505')
      return { error: 'Đã có sprint đang chạy. Hoàn tất sprint hiện tại trước.' }
    return { error: error.message }
  }
  return {}
}

export async function completeSprint(sprintId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('complete_sprint', { p_sprint_id: sprintId })
  if (error) return { error: error.message }
  return {}
}
