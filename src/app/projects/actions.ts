'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createProjectSchema } from '@/lib/validation/project'

export async function createProject(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = createProjectSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('projects').insert(parsed.data)
  if (error) {
    if (error.code === '23505') return { error: `Key "${parsed.data.key}" đã tồn tại` }
    return { error: error.message }
  }
  revalidatePath('/projects')
  return {}
}

export async function archiveProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projects')
  return {}
}
