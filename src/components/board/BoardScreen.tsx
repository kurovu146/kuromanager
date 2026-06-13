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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">{activeSprint.name}</span>
              {activeSprint.goal && (
                <span className="ml-2 text-sm text-muted-foreground">— {activeSprint.goal}</span>
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
            <p className="text-sm text-muted-foreground">
              Sprint chưa có issue. Tạo issue hoặc thêm từ backlog.
            </p>
          ) : (
            <BoardView issues={boardIssues} projectId={project.id} onOpenIssue={setSelected} />
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>Chưa có sprint nào đang chạy.</p>
          <p className="mt-1 text-sm">
            Vào{' '}
            <Link href={`/projects/${project.key}/backlog`} className="underline">
              Backlog
            </Link>{' '}
            để tạo & bắt đầu sprint.
          </p>
        </div>
      )}

      <IssueDetailDialog issue={selected} projectId={project.id} onClose={() => setSelected(null)} />
    </div>
  )
}
