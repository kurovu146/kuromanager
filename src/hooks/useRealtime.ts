'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe thay đổi 1 bảng (Supabase Realtime) và invalidate query tương ứng,
 * giúp board/issue tự cập nhật khi người khác thao tác.
 */
export function useRealtimeInvalidate(opts: {
  channel: string
  table: string
  filter?: string
  queryKey: (string | undefined)[]
  enabled?: boolean
}) {
  const qc = useQueryClient()
  const { channel, table, filter, queryKey, enabled = true } = opts
  const key = JSON.stringify(queryKey)

  useEffect(() => {
    if (!enabled) return
    const supabase = createClient()
    const ch = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, table, filter, key, enabled])
}
