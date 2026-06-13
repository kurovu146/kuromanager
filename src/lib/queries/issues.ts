'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { IssueType, IssuePriority, IssueStatus } from '@/lib/issue-meta'

export type IssueAssignee = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

export type Issue = {
  id: string
  project_id: string
  key: string
  title: string
  description: string | null
  type: IssueType
  status: IssueStatus
  priority: IssuePriority
  story_points: number | null
  assignee_id: string | null
  reporter_id: string
  sprint_id: string | null
  rank: number
  created_at: string
  updated_at: string
  assignee: IssueAssignee | null
}

const SELECT = '*, assignee:profiles!issues_assignee_id_fkey(id,full_name,email,avatar_url)'

/** Tất cả issue của 1 project (sắp theo rank). Board/backlog tự lọc từ đây. */
export function useIssues(projectId: string | undefined) {
  return useQuery({
    enabled: !!projectId,
    queryKey: ['issues', projectId],
    queryFn: async (): Promise<Issue[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('issues')
        .select(SELECT)
        .eq('project_id', projectId!)
        .order('rank', { ascending: true })
      if (error) throw error
      return data as unknown as Issue[]
    },
  })
}
