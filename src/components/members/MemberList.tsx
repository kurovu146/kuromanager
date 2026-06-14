'use client'

import { useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMembers } from '@/lib/queries/members'
import { useCurrentProfile } from '@/lib/queries/me'
import { updateRole } from '@/app/members/actions'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const selectClass =
  'h-8 w-28 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40'

function initials(name: string | null, email: string) {
  return (name?.trim() || email).slice(0, 2).toUpperCase()
}

export function MemberList() {
  const { data, isLoading } = useMembers()
  const { data: me } = useCurrentProfile()
  const [, startTransition] = useTransition()
  const qc = useQueryClient()
  const isAdmin = me?.role === 'admin'

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl border bg-muted/40" />

  function changeRole(id: string, role: 'admin' | 'member') {
    startTransition(async () => {
      const res = await updateRole(id, role)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Đã đổi vai trò')
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['me'] })
    })
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {data?.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/12 text-xs font-semibold text-brand">
              {initials(m.full_name, m.email)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">
                {m.full_name || m.email}
                {m.id === me?.id && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(bạn)</span>
                )}
              </p>
              <p className="truncate text-sm text-muted-foreground">{m.email}</p>
            </div>
          </div>
          {isAdmin ? (
            <select
              defaultValue={m.role}
              className={selectClass}
              onChange={(e) => changeRole(m.id, e.target.value as 'admin' | 'member')}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>
              {m.role === 'admin' ? 'Quản trị' : 'Thành viên'}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  )
}
