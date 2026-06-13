import { ProjectList } from '@/components/project/ProjectList'
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dự án</h1>
        <CreateProjectDialog />
      </div>
      <ProjectList />
    </div>
  )
}
