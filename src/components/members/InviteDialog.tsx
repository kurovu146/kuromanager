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

export function InviteDialog() {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string>()
  const [pending, startTransition] = useTransition()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await inviteMember(fd)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setLink(res.link)
      toast.success('Đã tạo lời mời — copy link gửi cho thành viên')
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setLink(undefined)
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
          {link && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Link mời (copy gửi thành viên):</p>
              <div className="rounded bg-muted p-2 text-xs break-all select-all">{link}</div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
