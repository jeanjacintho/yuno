import { Sidebar } from '../components/Sidebar'
import { MediaGrid } from '../components/MediaGrid'

type GroupPageProps = {
  groupId: string
}

export function GroupPage({ groupId }: GroupPageProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar selectedGroupId={groupId} />
      <main className="flex-1 p-6">
        <MediaGrid groupId={groupId} />
      </main>
    </div>
  )
}
