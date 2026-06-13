'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, changePasswordSchema } from '@/lib/validation/auth'

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: 'Email hoặc mật khẩu không đúng' }
  redirect('/projects')
}

export async function changePassword(formData: FormData) {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }

  await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id)
  redirect('/projects')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
