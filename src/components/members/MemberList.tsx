'use client'

import { useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMembers } from '@/lib/queries/members'
import { useCurrentProfile } from '@/lib/queries/me'
import { updateRole } from '@/app/members/actions'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const selectClass =
  'h-8 w-28 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function MemberList() {
  const { data, isLoading } = useMembers()
  const { data: me } = useCurrentProfile()
  const [, startTransition] = useTransition()
  const qc = useQueryClient()
  const isAdmin = me?.role === 'admin'

  if (isLoading) return <p className="text-muted-foreground">Đang tải…</p>

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
    <ul className="divide-y rounded-md border">
      {data?.map((m) => (
        <li key={m.id} className="flex items-center justify-between p-3">
          <div>
            <p className="font-medium">
              {m.full_name || m.email}
              {m.id === me?.id && (
                <span className="ml-2 text-xs text-muted-foreground">(bạn)</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{m.email}</p>
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
            <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>{m.role}</Badge>
          )}
        </li>
      ))}
    </ul>
  )
}
