'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { acceptInvite } from '@/app/members/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function InviteClient({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password: String(fd.get('password')),
        options: { data: { full_name: String(fd.get('fullName')) } },
      })
      if (error || !data.user) {
        toast.error(error?.message ?? 'Đăng ký thất bại')
        return
      }
      const res = await acceptInvite(token, data.user.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Tham gia thành công!')
      router.push('/projects')
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tham gia KuroManager</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fullName">Họ tên</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Đang xử lý…' : 'Tham gia'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
