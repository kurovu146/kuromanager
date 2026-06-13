'use client'

import { useState, useTransition } from 'react'
import { changePassword } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function onSubmit(fd: FormData) {
    setError(undefined)
    startTransition(async () => {
      const res = await changePassword(fd)
      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="password">Mật khẩu mới</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm">Nhập lại mật khẩu</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={6} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Đang lưu…' : 'Đổi mật khẩu'}
      </Button>
    </form>
  )
}
