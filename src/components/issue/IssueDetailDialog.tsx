'use client'

import { useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Issue } from '@/lib/queries/issues'
import { useMembers } from '@/lib/queries/members'
import { useSprints } from '@/lib/queries/sprints'
import { useComments } from '@/lib/queries/comments'
import { useCurrentProfile } from '@/lib/queries/me'
import { updateIssue, deleteIssue } from '@/app/issues/actions'
import { addComment, deleteComment } from '@/app/comments/actions'
import { useRealtimeInvalidate } from '@/hooks/useRealtime'
import {
  ISSUE_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  TYPE_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '@/lib/issue-meta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

const selectClass =
  'h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function IssueDetailDialog({
  issue,
  projectId,
  onClose,
}: {
  issue: Issue | null
  projectId: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { data: members } = useMembers()
  const { data: sprints } = useSprints(projectId)
  const { data: comments } = useComments(issue?.id)
  const { data: me } = useCurrentProfile()
  const [, startTransition] = useTransition()
  const [body, setBody] = useState('')

  useRealtimeInvalidate({
    channel: `comments-${issue?.id ?? 'none'}`,
    table: 'comments',
    filter: issue ? `issue_id=eq.${issue.id}` : undefined,
    queryKey: ['comments', issue?.id],
    enabled: !!issue,
  })

  if (!issue) return null

  function patch(field: string, value: unknown) {
    startTransition(async () => {
      const res = await updateIssue(issue!.id, { [field]: value })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      qc.invalidateQueries({ queryKey: ['issues', projectId] })
    })
  }

  function onAddComment() {
    const text = body.trim()
    if (!text) return
    startTransition(async () => {
      const res = await addComment(issue!.id, text)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setBody('')
      qc.invalidateQueries({ queryKey: ['comments', issue!.id] })
    })
  }

  function onDeleteIssue() {
    startTransition(async () => {
      const res = await deleteIssue(issue!.id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã xóa issue')
      qc.invalidateQueries({ queryKey: ['issues', projectId] })
      onClose()
    })
  }

  const canDelete = me?.role === 'admin' || me?.id === issue.reporter_id
  const plannedOrActive = (sprints ?? []).filter((s) => s.status !== 'completed')

  return (
    <Dialog open={!!issue} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm text-muted-foreground">{issue.key}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            defaultValue={issue.title}
            className="text-base font-medium"
            onBlur={(e) => e.target.value !== issue.title && patch('title', e.target.value)}
          />

          <div className="space-y-1">
            <Label>Mô tả</Label>
            <Textarea
              defaultValue={issue.description ?? ''}
              placeholder="Thêm mô tả…"
              onBlur={(e) =>
                e.target.value !== (issue.description ?? '') &&
                patch('description', e.target.value || null)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <select
                className={selectClass}
                defaultValue={issue.status}
                onChange={(e) => patch('status', e.target.value)}
              >
                {ISSUE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Loại</Label>
              <select
                className={selectClass}
                defaultValue={issue.type}
                onChange={(e) => patch('type', e.target.value)}
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Ưu tiên</Label>
              <select
                className={selectClass}
                defaultValue={issue.priority}
                onChange={(e) => patch('priority', e.target.value)}
              >
                {ISSUE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Người nhận</Label>
              <select
                className={selectClass}
                defaultValue={issue.assignee_id ?? ''}
                onChange={(e) => patch('assignee_id', e.target.value || null)}
              >
                <option value="">— Chưa giao —</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Story points</Label>
              <Input
                type="number"
                min={0}
                defaultValue={issue.story_points ?? ''}
                onBlur={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null
                  if (v !== issue.story_points) patch('story_points', v)
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Sprint</Label>
              <select
                className={selectClass}
                defaultValue={issue.sprint_id ?? ''}
                onChange={(e) => patch('sprint_id', e.target.value || null)}
              >
                <option value="">Backlog</option>
                {plannedOrActive.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.status === 'active' ? '(active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2 border-t pt-4">
            <Label>Bình luận</Label>
            <div className="space-y-3">
              {comments?.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
              )}
              {comments?.map((c) => (
                <div key={c.id} className="rounded-md bg-muted/50 p-2 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{c.author?.full_name || c.author?.email}</span>
                    {(me?.role === 'admin' || me?.id === c.author_id) && (
                      <button
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          startTransition(async () => {
                            await deleteComment(c.id)
                            qc.invalidateQueries({ queryKey: ['comments', issue.id] })
                          })
                        }
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Viết bình luận…"
                className="min-h-9"
              />
              <Button type="button" onClick={onAddComment}>
                Gửi
              </Button>
            </div>
          </div>

          {canDelete && (
            <div className="border-t pt-3">
              <Button type="button" variant="destructive" size="sm" onClick={onDeleteIssue}>
                Xóa issue
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
