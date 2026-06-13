import { BacklogScreen } from '@/components/backlog/BacklogScreen'

export default async function BacklogPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  return <BacklogScreen projectKey={key} />
}
