import { createClient } from '@/lib/supabase/server'
import { InviteClient } from './InviteClient'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .rpc('invite_preview', { p_token: token })
    .single<{ email: string; status: string; expired: boolean }>()

  if (!data || data.status !== 'pending' || data.expired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-red-500">Lời mời không hợp lệ hoặc đã hết hạn.</p>
      </div>
    )
  }
  return <InviteClient token={token} email={data.email} />
}
