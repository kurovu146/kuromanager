'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Member = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'member'
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async (): Promise<Member[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,role')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Member[]
    },
  })
}
