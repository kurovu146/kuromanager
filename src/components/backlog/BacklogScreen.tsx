'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useProject } from '@/lib/queries/project'
import { useIssues, type Issue } from '@/lib/queries/issues'
import { useSprints, type Sprint } from '@/lib/queries/sprints'
import { useRealtimeInvalidate } from '@/hooks/useRealtime'
import { updateIssue } from '@/app/issues/actions'
import { startSprint, completeSprint } from '@/app/sprints/actions'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { CreateSprintDialog } from './CreateSprintDialog'
import { IssueCreateDialog } from '@/components/issue/IssueCreateDialog'
import { IssueDetailDialog } from '@/components/issue/IssueDetailDialog'
import { Button } from '@/components/ui/button'
import { TYPE_ICON, STATUS_LABEL } from '@/lib/issue-meta'
import { toast } from 'sonner'

const selectClass =
  'h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring'

function points(issues: Issue[]) {
  const sum = issues.reduce((a, i) => a + (i.story_points ?? 0), 0)
  return sum > 0 ? `${sum} pts` : null
}

export function BacklogScreen({ projectKey }: { projectKey: string }) {
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

  const allIssues = issues ?? []
  const openSprints = (sprints ?? []).filter((s) => s.status !== 'completed')
  const moveTargets = openSprints
  const hasActive = openSprints.some((s) => s.status === 'active')

  function moveTo(issue: Issue, sprintId: string | null) {
    qc.setQueryData<Issue[]>(['issues', project!.id], (old) =>
      (old ?? []).map((i) => (i.id === issue.id ? { ...i, sprint_id: sprintId } : i)),
    )
    updateIssue(issue.id, { sprint_id: sprintId }).then((res) => {
      if (res?.error) {
        toast.error(res.error)
        qc.invalidateQueries({ queryKey: ['issues', project!.id] })
      }
    })
  }

  function onStart(sprint: Sprint) {
    startSprint(sprint.id).then((res) => {
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Bắt đầu ${sprint.name}`)
      qc.invalidateQueries({ queryKey: ['sprints', project!.id] })
    })
  }

  function onComplete(sprint: Sprint) {
    if (!confirm('Hoàn tất sprint? Issue chưa Done sẽ trả về backlog.')) return
    completeSprint(sprint.id).then((res) => {
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã hoàn tất sprint')
      qc.invalidateQueries({ queryKey: ['sprints', project!.id] })
      qc.invalidateQueries({ queryKey: ['issues', project!.id] })
    })
  }

  function Row({ issue }: { issue: Issue }) {
    return (
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted/40">
        <span title={issue.type}>{TYPE_ICON[issue.type]}</span>
        <button className="flex-1 truncate text-left" onClick={() => setSelected(issue)}>
          <span className="mr-2 font-mono text-xs text-muted-foreground">{issue.key}</span>
          {issue.title}
        </button>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {STATUS_LABEL[issue.status]}
        </span>
        {issue.story_points != null && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[11px]">
            {issue.story_points}
          </span>
        )}
        <select
          className={selectClass}
          value={issue.sprint_id ?? ''}
          onChange={(e) => moveTo(issue, e.target.value || null)}
        >
          <option value="">Backlog</option>
          {moveTargets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  function sprintIssues(sprintId: string) {
    return allIssues.filter((i) => i.sprint_id === sprintId)
  }
  const backlogIssues = allIssues.filter((i) => i.sprint_id === null)

  return (
    <div className="space-y-5">
      <ProjectHeader projectKey={project.key} projectName={project.name} active="backlog" />

      <div className="flex justify-end">
        <CreateSprintDialog projectId={project.id} />
      </div>

      {openSprints.map((sprint) => {
        const list = sprintIssues(sprint.id)
        return (
          <section key={sprint.id} className="rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{sprint.name}</span>
                {sprint.status === 'active' && (
                  <span className="rounded bg-green-600/15 px-1.5 py-0.5 text-xs text-green-700">
                    active
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {list.length} issue {points(list) ? `· ${points(list)}` : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <IssueCreateDialog projectId={project.id} sprintId={sprint.id} label="+ Issue" />
                {sprint.status === 'planned' ? (
                  <Button
                    size="sm"
                    onClick={() => onStart(sprint)}
                    disabled={list.length === 0 || hasActive}
                    title={hasActive ? 'Đã có sprint đang chạy' : undefined}
                  >
                    Bắt đầu
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onComplete(sprint)}>
                    Hoàn tất
                  </Button>
                )}
              </div>
            </div>
            {list.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                Chưa có issue. Thêm từ backlog bên dưới hoặc tạo mới.
              </p>
            ) : (
              <div>{list.map((i) => <Row key={i.id} issue={i} />)}</div>
            )}
          </section>
        )
      })}

      <section className="rounded-lg border">
        <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Backlog</span>
            <span className="text-xs text-muted-foreground">
              {backlogIssues.length} issue {points(backlogIssues) ? `· ${points(backlogIssues)}` : ''}
            </span>
          </div>
          <IssueCreateDialog projectId={project.id} sprintId={null} label="+ Issue" />
        </div>
        {backlogIssues.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Backlog trống.</p>
        ) : (
          <div>{backlogIssues.map((i) => <Row key={i.id} issue={i} />)}</div>
        )}
      </section>

      <IssueDetailDialog issue={selected} projectId={project.id} onClose={() => setSelected(null)} />
    </div>
  )
}
