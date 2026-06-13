'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { inviteSchema } from '@/lib/validation/invite'

export async function inviteMember(formData: FormData) {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const token = randomBytes(24).toString('hex')
  const { error } = await supabase.from('invitations').insert({
    email: parsed.data.email,
    role: parsed.data.role,
    token,
  })
  if (error) {
    if (error.code === '42501') return { error: 'Chỉ admin được mời thành viên' }
    return { error: error.message }
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  revalidatePath('/settings/members')
  // MVP: trả link để admin gửi tay (chưa tích hợp email service).
  return { link: `${base}/invite/${token}` }
}

// Bảo mật: KHÔNG nhận userId từ client. RPC dùng auth.uid() + kiểm tra email khớp lời mời.
export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('accept_invite', { p_token: token })
  if (error) return { error: error.message }
  return {}
}

export async function updateRole(userId: string, role: 'admin' | 'member') {
  const supabase = await createClient()

  // Chặn hạ cấp admin cuối cùng → tránh khoá toàn bộ (không còn ai quản trị).
  if (role === 'member') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if ((count ?? 0) <= 1) return { error: 'Phải còn ít nhất 1 admin' }
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) {
    if (error.code === '42501') return { error: 'Chỉ admin được đổi vai trò' }
    if (error.code === 'P0001') return { error: 'Chỉ admin được đổi vai trò' }
    return { error: error.message }
  }
  revalidatePath('/settings/members')
  return {}
}
