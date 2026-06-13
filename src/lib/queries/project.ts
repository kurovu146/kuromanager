'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Project } from './projects'

/** 1 project theo key (vd WEB). */
export function useProject(key: string) {
  return useQuery({
    queryKey: ['project', key],
    queryFn: async (): Promise<Project | null> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('key', key)
        .maybeSingle()
      if (error) throw error
      return data as Project | null
    },
  })
}
