'use client'

import { useCurrentProfile } from '@/lib/queries/me'
import { InviteDialog } from './InviteDialog'

export function MembersHeader() {
  const { data: me } = useCurrentProfile()
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Thành viên</h1>
      {me?.role === 'admin' && <InviteDialog />}
    </div>
  )
}
