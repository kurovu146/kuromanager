'use client'

import { useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createProject } from '@/app/projects/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const qc = useQueryClient()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await createProject(fd)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã tạo project')
      qc.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Tạo project</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">Project mới</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Tên</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              name="key"
              placeholder="WEB"
              required
              className="uppercase"
              onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
            />
            <p className="text-xs text-muted-foreground">In hoa, 2–10 ký tự (dùng cho mã issue, vd WEB-12)</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" name="description" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Đang tạo…' : 'Tạo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
