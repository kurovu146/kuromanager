'use client'

import { useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createSprint } from '@/app/sprints/actions'
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

export function CreateSprintDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const qc = useQueryClient()

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await createSprint(projectId, {
        name: String(fd.get('name') || ''),
        goal: String(fd.get('goal') || ''),
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã tạo sprint')
      qc.invalidateQueries({ queryKey: ['sprints', projectId] })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">Tạo sprint</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sprint mới</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Tên</Label>
            <Input id="name" name="name" placeholder="Sprint 1" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="goal">Mục tiêu</Label>
            <Textarea id="goal" name="goal" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Đang tạo…' : 'Tạo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
