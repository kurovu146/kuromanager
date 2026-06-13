export const ISSUE_TYPES = ['story', 'task', 'bug'] as const
export const ISSUE_PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'] as const
export const ISSUE_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const

export type IssueType = (typeof ISSUE_TYPES)[number]
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number]
export type IssueStatus = (typeof ISSUE_STATUSES)[number]

export const TYPE_LABEL: Record<IssueType, string> = {
  story: 'Story',
  task: 'Task',
  bug: 'Bug',
}

export const TYPE_ICON: Record<IssueType, string> = {
  story: '📗',
  task: '✓',
  bug: '🐞',
}

export const PRIORITY_LABEL: Record<IssuePriority, string> = {
  lowest: 'Thấp nhất',
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  highest: 'Cao nhất',
}

export const PRIORITY_RANK: Record<IssuePriority, number> = {
  lowest: 0,
  low: 1,
  medium: 2,
  high: 3,
  highest: 4,
}

export const STATUS_LABEL: Record<IssueStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

/** Thứ tự cột trên board. */
export const BOARD_COLUMNS: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done']
