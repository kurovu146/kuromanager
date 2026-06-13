'use client'

import { useState, useTransition } from 'react'
import { inviteMember } from '@/app/members/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const selectClass =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

type InviteResult = { link: string; emailSent?: boolean; emailError?: string }

export function InviteDialog() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<InviteResult>()
  const [pending, startTransition] = useTransition()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await inviteMember(fd)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setResult(res as InviteResult)
      if ((res as InviteResult).emailSent) toast.success('Đã gửi email mời')
      else toast.success('Đã tạo lời mời — copy link gửi cho thành viên')
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setResult(undefined)
      }}
    >
      <DialogTrigger render={<Button>Mời thành viên</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mời thành viên</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Vai trò</Label>
            <select id="role" name="role" defaultValue="member" className={selectClass}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Đang tạo…' : 'Tạo lời mời'}
          </Button>
          {result && (
            <div className="space-y-1">
              {result.emailSent ? (
                <p className="text-xs text-green-600">✓ Đã gửi email mời.</p>
              ) : (
                <p className="text-xs text-amber-600">
                  Email chưa gửi được{result.emailError ? ` (${result.emailError})` : ''} — copy link gửi tay:
                </p>
              )}
              <div className="rounded bg-muted p-2 text-xs break-all select-all">{result.link}</div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
