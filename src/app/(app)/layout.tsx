import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Ép đổi mật khẩu lần đầu: ai còn must_change_password thì không vào được app
  // cho tới khi đặt mật khẩu mới (enforce server-side, mọi route trong nhóm (app)).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('must_change_password')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.must_change_password) redirect('/change-password')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
