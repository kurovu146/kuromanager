'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Comment = {
  id: string
  issue_id: string
  author_id: string
  body: string
  created_at: string
  author: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

export function useComments(issueId: string | undefined) {
  return useQuery({
    enabled: !!issueId,
    queryKey: ['comments', issueId],
    queryFn: async (): Promise<Comment[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles!comments_author_id_fkey(id,full_name,email,avatar_url)')
        .eq('issue_id', issueId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as Comment[]
    },
  })
}
