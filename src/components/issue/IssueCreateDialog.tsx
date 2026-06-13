'use client'

import { useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createIssue } from '@/app/issues/actions'
import { useMembers } from '@/lib/queries/members'
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
import { ISSUE_TYPES, ISSUE_PRIORITIES, TYPE_LABEL, PRIORITY_LABEL } from '@/lib/issue-meta'
import { toast } from 'sonner'

const selectClass =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function IssueCreateDialog({
  projectId,
  sprintId = null,
  label = 'Tạo issue',
}: {
  projectId: string
  sprintId?: string | null
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const qc = useQueryClient()
  const { data: members } = useMembers()

  function onSubmit(fd: FormData) {
    const sp = fd.get('storyPoints') as string
    const assignee = fd.get('assigneeId') as string
    startTransition(async () => {
      const res = await createIssue({
        projectId,
        title: String(fd.get('title') || ''),
        type: String(fd.get('type') || 'task'),
        priority: String(fd.get('priority') || 'medium'),
        description: String(fd.get('description') || ''),
        storyPoints: sp ? Number(sp) : null,
        assigneeId: assignee || null,
        sprintId,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã tạo issue')
      qc.invalidateQueries({ queryKey: ['issues', projectId] })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">{label}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue mới</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Tiêu đề</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="type">Loại</Label>
              <select id="type" name="type" defaultValue="task" className={selectClass}>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="priority">Ưu tiên</Label>
              <select id="priority" name="priority" defaultValue="medium" className={selectClass}>
                {ISSUE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="assigneeId">Người nhận</Label>
              <select id="assigneeId" name="assigneeId" defaultValue="" className={selectClass}>
                <option value="">— Chưa giao —</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="storyPoints">Story points</Label>
              <Input id="storyPoints" name="storyPoints" type="number" min={0} />
            </div>
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
