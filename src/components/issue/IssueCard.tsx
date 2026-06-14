'use client'

import { BookOpen, SquareCheckBig, Bug, ChevronUp } from 'lucide-react'
import type { Issue } from '@/lib/queries/issues'
import { PRIORITY_LABEL, type IssueType } from '@/lib/issue-meta'

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase()
}

const TYPE_META: Record<IssueType, { Icon: typeof BookOpen; color: string }> = {
  story: { Icon: BookOpen, color: 'text-emerald-600' },
  task: { Icon: SquareCheckBig, color: 'text-sky-600' },
  bug: { Icon: Bug, color: 'text-red-600' },
}

const PRIORITY_COLOR: Record<string, string> = {
  lowest: 'text-zinc-400',
  low: 'text-sky-500',
  medium: 'text-amber-500',
  high: 'text-orange-600',
  highest: 'text-red-600',
}

export function IssueCard({ issue, onClick }: { issue: Issue; onClick?: () => void }) {
  const { Icon, color } = TYPE_META[issue.type]
  return (
    <div
      onClick={onClick}
      className="cursor-pointer space-y-2.5 rounded-lg border bg-card p-3 shadow-[0_1px_2px_rgba(40,30,20,0.04)] transition-all hover:border-brand/50 hover:shadow-[0_6px_18px_-10px_rgba(40,30,20,0.4)]"
    >
      <p className="text-sm leading-snug font-medium">{issue.title}</p>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Icon className={`size-3.5 ${color}`} />
          <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
          <ChevronUp
            className={`size-3.5 ${PRIORITY_COLOR[issue.priority]}`}
            aria-label={PRIORITY_LABEL[issue.priority]}
          />
        </span>
        <div className="flex items-center gap-1.5">
          {issue.story_points != null && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-semibold text-secondary-foreground">
              {issue.story_points}
            </span>
          )}
          {issue.assignee && (
            <span
              className="flex size-6 items-center justify-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand"
              title={issue.assignee.full_name || issue.assignee.email}
            >
              {initials(issue.assignee.full_name, issue.assignee.email)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
