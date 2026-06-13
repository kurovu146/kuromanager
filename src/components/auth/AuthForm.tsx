'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Action = (fd: FormData) => Promise<{ error?: string } | void>

export function AuthForm({
  mode,
  action,
}: {
  mode: 'signin' | 'signup'
  action: Action
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function onSubmit(formData: FormData) {
    setError(undefined)
    startTransition(async () => {
      const res = await action(formData)
      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div className="space-y-1">
          <Label htmlFor="fullName">Họ tên</Label>
          <Input id="fullName" name="fullName" required />
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Đang xử lý…' : mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
      </Button>
    </form>
  )
}
