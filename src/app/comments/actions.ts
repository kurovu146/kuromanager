'use server'

import { createClient } from '@/lib/supabase/server'

export async function addComment(issueId: string, body: string) {
  const text = body.trim()
  if (!text) return { error: 'Nội dung trống' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { error } = await supabase
    .from('comments')
    .insert({ issue_id: issueId, author_id: user.id, body: text })
  if (error) return { error: error.message }
  return {}
}

export async function deleteComment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}
