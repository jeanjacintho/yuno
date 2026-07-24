import { MediaPlayer } from './MediaPlayer'

type MediaGridProps = {
  groupId: string
}

export function MediaGrid({ groupId }: MediaGridProps) {
  return (
    <section>
      <h1 className="mb-6 text-xl font-semibold">Aulas — {groupId}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* cards com thumbnail, nome, tipo, progresso */}
      </div>
      <MediaPlayer />
    </section>
  )
}
