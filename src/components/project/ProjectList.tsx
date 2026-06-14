'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useProjects } from '@/lib/queries/projects'

export function ProjectList() {
  const { data, isLoading, error } = useProjects()

  if (isLoading)
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted/40" />
        ))}
      </div>
    )
  if (error) return <p className="text-destructive">Lỗi tải project: {(error as Error).message}</p>
  if (!data?.length)
    return (
      <div className="rounded-xl border border-dashed py-20 text-center">
        <p className="font-display text-2xl">Chưa có dự án nào</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tạo dự án đầu tiên để bắt đầu lập kế hoạch sprint.
        </p>
      </div>
    )

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((p) => (
        <Link key={p.id} href={`/projects/${p.key}/board`} className="group">
          <article className="relative h-full overflow-hidden rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_12px_32px_-16px_rgba(40,30,20,0.35)]">
            <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-200 group-hover:scale-x-100" />
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl leading-tight">{p.name}</h3>
              <span className="shrink-0 rounded-md border bg-secondary px-2 py-0.5 font-mono text-xs font-medium text-secondary-foreground">
                {p.key}
              </span>
            </div>
            <p className="mt-2.5 line-clamp-2 min-h-10 text-sm text-muted-foreground">
              {p.description || 'Chưa có mô tả.'}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Mở bảng <ArrowRight className="size-3.5" />
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}
