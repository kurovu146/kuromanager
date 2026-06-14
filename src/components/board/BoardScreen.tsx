'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useProject } from '@/lib/queries/project'
import { useIssues, type Issue } from '@/lib/queries/issues'
import { useSprints } from '@/lib/queries/sprints'
import { useRealtimeInvalidate } from '@/hooks/useRealtime'
import { completeSprint } from '@/app/sprints/actions'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { BoardView } from './BoardView'
import { IssueCreateDialog } from '@/components/issue/IssueCreateDialog'
import { IssueDetailDialog } from '@/components/issue/IssueDetailDialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function BoardScreen({ projectKey }: { projectKey: string }) {
  const qc = useQueryClient()
  const { data: project, isLoading } = useProject(projectKey)
  const { data: issues } = useIssues(project?.id)
  const { data: sprints } = useSprints(project?.id)
  const [selected, setSelected] = useState<Issue | null>(null)

  useRealtimeInvalidate({
    channel: `issues-${project?.id ?? 'none'}`,
    table: 'issues',
    filter: project ? `project_id=eq.${project.id}` : undefined,
    queryKey: ['issues', project?.id],
    enabled: !!project,
  })

  if (isLoading) return <p className="text-muted-foreground">Đang tải…</p>
  if (!project) return <p className="text-red-500">Không tìm thấy project.</p>

  const activeSprint = (sprints ?? []).find((s) => s.status === 'active')
  const boardIssues = (issues ?? []).filter((i) => i.sprint_id === activeSprint?.id)

  function onComplete() {
    if (!activeSprint) return
    if (!confirm('Hoàn tất sprint? Issue chưa Done sẽ trả về backlog.')) return
    completeSprint(activeSprint.id).then((res) => {
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã hoàn tất sprint')
      qc.invalidateQueries({ queryKey: ['sprints', project!.id] })
      qc.invalidateQueries({ queryKey: ['issues', project!.id] })
    })
  }

  return (
    <div className="space-y-4">
      <ProjectHeader projectKey={project.key} projectName={project.name} active="board" />

      {activeSprint ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                Đang chạy
              </span>
              <span className="font-display text-lg">{activeSprint.name}</span>
              {activeSprint.goal && (
                <span className="text-sm text-muted-foreground">— {activeSprint.goal}</span>
              )}
            </div>
            <div className="flex gap-2">
              <IssueCreateDialog projectId={project.id} sprintId={activeSprint.id} />
              <Button size="sm" variant="outline" onClick={onComplete}>
                Hoàn tất sprint
              </Button>
            </div>
          </div>
          {boardIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <p className="font-display text-xl">Sprint chưa có issue</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tạo issue mới hoặc kéo từ backlog vào sprint này.
              </p>
            </div>
          ) : (
            <BoardView issues={boardIssues} projectId={project.id} onOpenIssue={setSelected} />
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <p className="font-display text-2xl">Chưa có sprint đang chạy</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Vào{' '}
            <Link href={`/projects/${project.key}/backlog`} className="font-medium text-brand underline-offset-2 hover:underline">
              Backlog
            </Link>{' '}
            để tạo &amp; bắt đầu sprint.
          </p>
        </div>
      )}

      <IssueDetailDialog issue={selected} projectId={project.id} onClose={() => setSelected(null)} />
    </div>
  )
}
