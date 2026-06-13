'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Project = {
  id: string
  key: string
  name: string
  description: string | null
  lead_id: string | null
  archived_at: string | null
  created_at: string
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
