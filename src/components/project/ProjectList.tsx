'use client'

import Link from 'next/link'
import { useProjects } from '@/lib/queries/projects'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ProjectList() {
  const { data, isLoading, error } = useProjects()

  if (isLoading) return <p className="text-muted-foreground">Đang tải…</p>
  if (error) return <p className="text-red-500">Lỗi tải project: {(error as Error).message}</p>
  if (!data?.length)
    return <p className="text-muted-foreground">Chưa có project nào. Tạo project đầu tiên nhé.</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((p) => (
        <Link key={p.id} href={`/projects/${p.key}/board`}>
          <Card className="h-full transition hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <Badge variant="secondary">{p.key}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {p.description || '—'}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
