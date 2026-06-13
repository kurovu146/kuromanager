import { BoardScreen } from '@/components/board/BoardScreen'

export default async function BoardPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  return <BoardScreen projectKey={key} />
}
