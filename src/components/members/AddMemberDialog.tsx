'use client'

import { useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { addMember } from '@/app/members/actions'
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
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

type Created = { email: string; tempPassword: string }

export function AddMemberDialog() {
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<Created>()
  const [pending, startTransition] = useTransition()
  const qc = useQueryClient()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await addMember(fd)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setCreated({ email: res.email!, tempPassword: res.tempPassword! })
      toast.success('Đã tạo tài khoản thành viên')
      qc.invalidateQueries({ queryKey: ['members'] })
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setCreated(undefined)
      }}
    >
      <DialogTrigger render={<Button>Thêm thành viên</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm thành viên</DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tài khoản đã tạo. Gửi thông tin này cho thành viên (hiện 1 lần) — họ sẽ phải đổi mật
              khẩu khi đăng nhập lần đầu.
            </p>
            <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium select-all">{created.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mật khẩu tạm: </span>
                <span className="font-mono font-medium select-all">{created.tempPassword}</span>
              </div>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Xong
            </Button>
          </div>
        ) : (
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fullName">Họ tên (tùy chọn)</Label>
              <Input id="fullName" name="fullName" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Vai trò</Label>
              <select id="role" name="role" defaultValue="member" className={selectClass}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang tạo…' : 'Tạo tài khoản'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
