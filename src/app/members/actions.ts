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
  if (error) return { error: error.message }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  revalidatePath('/settings/members')
  // MVP: trả link để admin gửi tay (chưa tích hợp email service).
  return { link: `${base}/invite/${token}` }
}

export async function acceptInvite(token: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('accept_invite', {
    p_token: token,
    p_user_id: userId,
  })
  if (error) return { error: error.message }
  return {}
}

export async function updateRole(userId: string, role: 'admin' | 'member') {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/settings/members')
  return {}
}
