'use client'

import Link from 'next/link'

export function ProjectHeader({
  projectKey,
  projectName,
  active,
}: {
  projectKey: string
  projectName: string
  active: 'board' | 'backlog'
}) {
  const tab = (id: 'board' | 'backlog', label: string) => (
    <Link
      href={`/projects/${projectKey}/${id}`}
      className={`relative -mb-px border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors ${
        active === id
          ? 'border-brand text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          Dự án
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <h1 className="font-display text-3xl leading-none">{projectName}</h1>
        <span className="rounded-md border bg-secondary px-2 py-0.5 font-mono text-xs font-medium text-secondary-foreground">
          {projectKey}
        </span>
      </div>
      <nav className="flex gap-5 border-b">
        {tab('board', 'Bảng')}
        {tab('backlog', 'Backlog')}
      </nav>
    </div>
  )
}
