'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validation/auth'

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: 'Email hoặc mật khẩu không đúng' }
  redirect('/projects')
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  })
  if (error) return { error: error.message }
  redirect('/projects')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
