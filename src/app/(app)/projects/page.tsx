import { ProjectList } from '@/components/project/ProjectList'
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog'

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between border-b pb-5">
        <div>
          <p className="text-sm text-muted-foreground">Không gian làm việc</p>
          <h1 className="mt-1 font-display text-4xl">Dự án</h1>
        </div>
        <CreateProjectDialog />
      </header>
      <ProjectList />
    </div>
  )
}
