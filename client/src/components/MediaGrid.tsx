import { useEffect, useState } from 'react'
import { api, type MediaItem } from '../lib/api'
import { MediaPlayer } from './MediaPlayer'

type MediaGridProps = {
  groupId: string
  groupTitle: string
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '—'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function typeBadgeClass(type: MediaItem['type']): string {
  switch (type) {
    case 'video':
      return 'bg-blue-500/20 text-blue-300'
    case 'pdf':
      return 'bg-red-500/20 text-red-300'
    case 'photo':
      return 'bg-emerald-500/20 text-emerald-300'
    default:
      return 'bg-slate-500/20 text-slate-300'
  }
}

export function MediaGrid({ groupId, groupTitle }: MediaGridProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [nextOffsetId, setNextOffsetId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [watchedMap, setWatchedMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError(null)
      setItems([])
      setNextOffsetId(null)
      setSelectedItem(null)

      try {
        const [mediaResponse, progressResponse] = await Promise.all([
          api.dialogs.media(groupId),
          api.progress.get(groupId)
        ])

        if (cancelled) return

        setItems(mediaResponse.items)
        setNextOffsetId(mediaResponse.nextOffsetId)
        setWatchedMap(progressResponse.items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load media')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitial()

    return () => {
      cancelled = true
    }
  }, [groupId])

  async function loadMore() {
    if (!nextOffsetId || loadingMore) return

    setLoadingMore(true)
    setError(null)

    try {
      const response = await api.dialogs.media(groupId, nextOffsetId)
      setItems((current) => [...current, ...response.items])
      setNextOffsetId(response.nextOffsetId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more media')
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleWatchedChange(messageId: string, watched: boolean) {
    setWatchedMap((current) => ({ ...current, [messageId]: watched }))

    try {
      await api.progress.set({ chatId: groupId, messageId, watched })
    } catch (err) {
      setWatchedMap((current) => ({ ...current, [messageId]: !watched }))
      setError(err instanceof Error ? err.message : 'Failed to update progress')
    }
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{groupTitle}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {items.length} media item{items.length === 1 ? '' : 's'} loaded
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Loading lessons...</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="text-sm text-slate-500">No media found in this group yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const isWatched = Boolean(watchedMap[item.messageId])

          return (
            <button
              key={item.messageId}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-left transition hover:border-violet-500/50"
              onClick={() => setSelectedItem(item)}
              type="button"
            >
              <div className="relative flex aspect-video items-center justify-center bg-slate-950">
                {item.hasThumbnail ? (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={api.thumbnailUrl(groupId, item.messageId)}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-sm uppercase tracking-wide text-slate-600">
                    {item.type}
                  </span>
                )}

                {isWatched && (
                  <span className="absolute right-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    Watched
                  </span>
                )}
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${typeBadgeClass(item.type)}`}
                  >
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                </div>

                <h2 className="truncate text-sm font-medium" title={item.fileName}>
                  {item.fileName}
                </h2>

                <p className="text-xs text-slate-500">{formatFileSize(item.size)}</p>
              </div>
            </button>
          )
        })}
      </div>

      {nextOffsetId && (
        <div className="mt-8 flex justify-center">
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-60"
            disabled={loadingMore}
            onClick={loadMore}
            type="button"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      <MediaPlayer
        chatId={groupId}
        item={selectedItem}
        watched={selectedItem ? Boolean(watchedMap[selectedItem.messageId]) : false}
        onClose={() => setSelectedItem(null)}
        onWatchedChange={handleWatchedChange}
      />
    </section>
  )
}
