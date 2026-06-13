'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Member } from './members'

/** Hồ sơ của user đang đăng nhập (gồm role để gate UI admin). */
export function useCurrentProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<Member | null> => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,role')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data as Member
    },
  })
}
