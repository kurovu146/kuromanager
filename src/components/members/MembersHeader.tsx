'use client'

import { useCurrentProfile } from '@/lib/queries/me'
import { AddMemberDialog } from './AddMemberDialog'

export function MembersHeader() {
  const { data: me } = useCurrentProfile()
  return (
    <header className="flex items-end justify-between border-b pb-5">
      <div>
        <p className="text-sm text-muted-foreground">Quản lý</p>
        <h1 className="mt-1 font-display text-4xl">Thành viên</h1>
      </div>
      {me?.role === 'admin' && <AddMemberDialog />}
    </header>
  )
}
