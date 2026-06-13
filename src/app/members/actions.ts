'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { addMemberSchema } from '@/lib/validation/member'

/** Sinh mật khẩu tạm dễ đọc, đủ mạnh (~12 ký tự). */
function genTempPassword() {
  return randomBytes(9).toString('base64url')
}

/** Xác thực người gọi là admin. Trả về user nếu hợp lệ, ngược lại trả lỗi. */
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' as const }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return { error: 'Chỉ admin được thực hiện' as const }
  return { user }
}

export async function addMember(formData: FormData) {
  const gate = await requireAdmin()
  if ('error' in gate) return { error: gate.error }

  const parsed = addMemberSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { email, role } = parsed.data
  const fullName = parsed.data.fullName?.trim() || email.split('@')[0]

  const admin = createAdminClient()
  const tempPassword = genTempPassword()

  // 1) Tạo auth user (đã confirm, không cần email).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createErr || !created.user) {
    const msg = createErr?.message ?? ''
    if (/already|registered|exists/i.test(msg)) return { error: 'Email này đã có tài khoản' }
    return { error: msg || 'Tạo tài khoản thất bại' }
  }

  // 2) Tạo profile (bypass RLS qua service role) + bắt đổi mật khẩu lần đầu.
  const { error: profErr } = await admin.from('profiles').insert({
    id: created.user.id,
    email,
    full_name: fullName,
    role,
    must_change_password: true,
  })
  if (profErr) {
    // Rollback: xoá auth user để tránh tài khoản mồ côi không có profile.
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: profErr.message }
  }

  revalidatePath('/settings/members')
  return { email, tempPassword }
}

export async function updateRole(userId: string, role: 'admin' | 'member') {
  const gate = await requireAdmin()
  if ('error' in gate) return { error: gate.error }

  const supabase = await createClient()

  // Chặn hạ cấp admin cuối cùng → tránh khoá toàn bộ.
  if (role === 'member') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if ((count ?? 0) <= 1) return { error: 'Phải còn ít nhất 1 admin' }
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) {
    if (error.code === '42501' || error.code === 'P0001')
      return { error: 'Chỉ admin được đổi vai trò' }
    return { error: error.message }
  }
  revalidatePath('/settings/members')
  return {}
}
