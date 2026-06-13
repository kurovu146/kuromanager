'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export function ProjectHeader({
  projectKey,
  projectName,
  active,
}: {
  projectKey: string
  projectName: string
  active: 'board' | 'backlog'
}) {
  const tabClass = (tab: string) =>
    `border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
      active === tab
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          Dự án
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold">{projectName}</h1>
        <Badge variant="secondary">{projectKey}</Badge>
      </div>
      <nav className="flex gap-4 border-b">
        <Link href={`/projects/${projectKey}/board`} className={tabClass('board')}>
          Board
        </Link>
        <Link href={`/projects/${projectKey}/backlog`} className={tabClass('backlog')}>
          Backlog
        </Link>
      </nav>
    </div>
  )
}
