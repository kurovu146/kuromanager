'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type SprintStatus = 'planned' | 'active' | 'completed'

export type Sprint = {
  id: string
  project_id: string
  name: string
  goal: string | null
  status: SprintStatus
  start_date: string | null
  end_date: string | null
  completed_at: string | null
  created_at: string
}

export function useSprints(projectId: string | undefined) {
  return useQuery({
    enabled: !!projectId,
    queryKey: ['sprints', projectId],
    queryFn: async (): Promise<Sprint[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Sprint[]
    },
  })
}
