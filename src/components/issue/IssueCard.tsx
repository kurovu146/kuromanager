'use client'

import type { Issue } from '@/lib/queries/issues'
import { TYPE_ICON, PRIORITY_LABEL } from '@/lib/issue-meta'

function initials(name: string | null, email: string) {
  const base = name?.trim() || email
  return base.slice(0, 2).toUpperCase()
}

const PRIORITY_COLOR: Record<string, string> = {
  lowest: 'text-zinc-400',
  low: 'text-sky-500',
  medium: 'text-amber-500',
  high: 'text-orange-500',
  highest: 'text-red-600',
}

export function IssueCard({ issue, onClick }: { issue: Issue; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer space-y-2 rounded-md border bg-card p-3 text-sm shadow-xs hover:border-ring"
    >
      <p className="line-clamp-2 font-medium">{issue.title}</p>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span title={issue.type}>{TYPE_ICON[issue.type]}</span>
          <span className="font-mono">{issue.key}</span>
          <span className={PRIORITY_COLOR[issue.priority]} title={PRIORITY_LABEL[issue.priority]}>
            ▲
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          {issue.story_points != null && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-medium">
              {issue.story_points}
            </span>
          )}
          {issue.assignee && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
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
