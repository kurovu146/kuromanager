'use client'

import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import type { Issue } from '@/lib/queries/issues'
import { BOARD_COLUMNS, STATUS_LABEL, type IssueStatus } from '@/lib/issue-meta'
import { computeRank } from '@/lib/rank'
import { updateIssue } from '@/app/issues/actions'
import { IssueCard } from '@/components/issue/IssueCard'
import { toast } from 'sonner'

function SortableCard({ issue, onOpen }: { issue: Issue; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <IssueCard issue={issue} onClick={onOpen} />
    </div>
  )
}

function Column({
  status,
  issues,
  onOpen,
}: {
  status: IssueStatus
  issues: Issue[]
  onOpen: (i: Issue) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const dot: Record<string, string> = {
    todo: 'bg-zinc-400',
    in_progress: 'bg-amber-500',
    in_review: 'bg-violet-500',
    done: 'bg-emerald-500',
  }
  return (
    <div className="flex min-w-64 flex-1 flex-col rounded-xl border bg-muted/30">
      <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <span className={`size-2 rounded-full ${dot[status]}`} />
        <span>{STATUS_LABEL[status]}</span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] text-secondary-foreground normal-case">
          {issues.length}
        </span>
      </div>
      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-24 flex-1 flex-col gap-2.5 rounded-b-xl p-2.5 transition-colors ${isOver ? 'bg-brand/8' : ''}`}
        >
          {issues.map((i) => (
            <SortableCard key={i.id} issue={i} onOpen={() => onOpen(i)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function BoardView({
  issues,
  projectId,
  onOpenIssue,
}: {
  issues: Issue[]
  projectId: string
  onOpenIssue: (i: Issue) => void
}) {
  const qc = useQueryClient()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const columns = useMemo(() => {
    const map: Record<IssueStatus, Issue[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    }
    for (const i of [...issues].sort((a, b) => a.rank - b.rank)) map[i.status].push(i)
    return map
  }, [issues])

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return

    const issue = issues.find((i) => i.id === active.id)
    if (!issue) return

    const overId = String(over.id)
    let targetStatus: IssueStatus
    if ((BOARD_COLUMNS as string[]).includes(overId)) {
      targetStatus = overId as IssueStatus
    } else {
      const overIssue = issues.find((i) => i.id === over.id)
      if (!overIssue) return
      targetStatus = overIssue.status
    }

    const list = columns[targetStatus].filter((i) => i.id !== active.id)
    let index: number
    if ((BOARD_COLUMNS as string[]).includes(overId)) {
      index = list.length
    } else {
      index = list.findIndex((i) => i.id === over.id)
      if (index === -1) index = list.length
    }
    const newRank = computeRank(list[index - 1]?.rank, list[index]?.rank)

    if (issue.status === targetStatus && issue.rank === newRank) return

    qc.setQueryData<Issue[]>(['issues', projectId], (old) =>
      (old ?? []).map((i) =>
        i.id === active.id ? { ...i, status: targetStatus, rank: newRank } : i,
      ),
    )

    updateIssue(String(active.id), { status: targetStatus, rank: newRank }).then((res) => {
      if (res?.error) {
        toast.error(res.error)
        qc.invalidateQueries({ queryKey: ['issues', projectId] })
      }
    })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map((status) => (
          <Column key={status} status={status} issues={columns[status]} onOpen={onOpenIssue} />
        ))}
      </div>
    </DndContext>
  )
}
