import { MemberList } from '@/components/members/MemberList'
import { MembersHeader } from '@/components/members/MembersHeader'

export default function MembersPage() {
  return (
    <div className="space-y-8">
      <MembersHeader />
      <MemberList />
    </div>
  )
}
