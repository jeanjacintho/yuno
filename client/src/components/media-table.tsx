import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRightIcon,
  CircleCheckIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PlayIcon,
  SearchIcon,
  VideoIcon
} from 'lucide-react'
import { api, type MediaItem, type MediaType } from '@/lib/api'
import { LazyImage } from '@/components/LazyImage'
import { MediaPlayer } from '@/components/MediaPlayer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type MediaTableProps = {
  groupId: string
}

type MediaRow = MediaItem & {
  watched: boolean
}

type TypeFilter = 'all' | MediaType

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

function typeLabel(type: MediaType): string {
  switch (type) {
    case 'video':
      return 'Video'
    case 'pdf':
      return 'PDF'
    case 'photo':
      return 'Photo'
    default:
      return 'File'
  }
}

function TypeIcon({ type, className }: { type: MediaType; className?: string }) {
  switch (type) {
    case 'video':
      return <VideoIcon className={className} />
    case 'pdf':
      return <FileTextIcon className={className} />
    case 'photo':
      return <ImageIcon className={className} />
    default:
      return <FileIcon className={className} />
  }
}

function LessonSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <Skeleton className="aspect-video w-36 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function LessonRow({
  index,
  item,
  groupId,
  onOpen
}: {
  index: number
  item: MediaRow
  groupId: string
  onOpen: (item: MediaItem) => void
}) {
  return (
    <button
      className="group flex w-full items-center gap-4 border-b p-4 text-left transition-colors last:border-b-0 hover:bg-muted/50"
      onClick={() => onOpen(item)}
      type="button"
    >
      <span className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
        {index}
      </span>

      <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg border bg-muted">
        {item.hasThumbnail ? (
          <LazyImage
            alt=""
            className="size-full object-cover transition-transform group-hover:scale-105"
            src={api.thumbnailUrl(groupId, item.messageId)}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <TypeIcon className="size-6 text-muted-foreground" type={item.type} />
          </div>
        )}

        {item.type === 'video' && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex size-9 items-center justify-center rounded-full bg-background/90 shadow-sm">
              <PlayIcon className="size-4 fill-current" />
            </span>
          </span>
        )}

        {item.watched && (
          <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <CircleCheckIcon className="size-3" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="line-clamp-2 font-medium leading-snug">{item.fileName}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1 capitalize">
            <TypeIcon className="size-3" type={item.type} />
            {typeLabel(item.type)}
          </Badge>
          <span>{formatDate(item.date)}</span>
          {item.size > 0 && <span>{formatFileSize(item.size)}</span>}
          {item.watched && (
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
              Watched
            </Badge>
          )}
        </div>
      </div>

      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

export function MediaTable({ groupId }: MediaTableProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [nextOffsetId, setNextOffsetId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [watchedMap, setWatchedMap] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError(null)
      setItems([])
      setNextOffsetId(null)
      setSelectedItem(null)
      setQuery('')
      setTypeFilter('all')

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

  const rows = useMemo<MediaRow[]>(
    () =>
      items.map((item) => ({
        ...item,
        watched: Boolean(watchedMap[item.messageId])
      })),
    [items, watchedMap]
  )

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rows.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.fileName.toLowerCase().includes(normalizedQuery) ||
        item.type.toLowerCase().includes(normalizedQuery)

      const matchesType = typeFilter === 'all' || item.type === typeFilter

      return matchesQuery && matchesType
    })
  }, [rows, query, typeFilter])

  const watchedCount = useMemo(() => rows.filter((item) => item.watched).length, [rows])

  const typeCounts = useMemo(
    () => ({
      all: rows.length,
      video: rows.filter((item) => item.type === 'video').length,
      pdf: rows.filter((item) => item.type === 'pdf').length,
      photo: rows.filter((item) => item.type === 'photo').length,
      document: rows.filter((item) => item.type === 'document').length
    }),
    [rows]
  )

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

  if (selectedItem) {
    return (
      <div className="flex w-full flex-col gap-4">
        {error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <MediaPlayer
          chatId={groupId}
          item={selectedItem}
          watched={Boolean(watchedMap[selectedItem.messageId])}
          onBack={() => setSelectedItem(null)}
          onWatchedChange={handleWatchedChange}
        />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Lessons</h2>
          <p className="text-sm text-muted-foreground">
            {watchedCount} of {rows.length} watched
            {nextOffsetId ? ' · more available on Telegram' : ''}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">All ({typeCounts.all})</TabsTrigger>
              {typeCounts.video > 0 && (
                <TabsTrigger value="video">Videos ({typeCounts.video})</TabsTrigger>
              )}
              {typeCounts.pdf > 0 && (
                <TabsTrigger value="pdf">PDFs ({typeCounts.pdf})</TabsTrigger>
              )}
              {typeCounts.photo > 0 && (
                <TabsTrigger value="photo">Photos ({typeCounts.photo})</TabsTrigger>
              )}
              {typeCounts.document > 0 && (
                <TabsTrigger value="document">Files ({typeCounts.document})</TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search lessons..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, index) => (
              <LessonSkeleton key={index} />
            ))}
          </div>
        ) : filteredRows.length > 0 ? (
          filteredRows.map((item, index) => (
            <LessonRow
              key={item.messageId}
              groupId={groupId}
              index={index + 1}
              item={item}
              onOpen={setSelectedItem}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <p className="font-medium">No lessons found</p>
            <p className="text-sm text-muted-foreground">
              {query || typeFilter !== 'all'
                ? 'Try changing the search or filter.'
                : 'This group has no media yet.'}
            </p>
          </div>
        )}
      </div>

      {!loading && filteredRows.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {filteredRows.length} of {rows.length} loaded lesson
          {rows.length === 1 ? '' : 's'}
        </p>
      )}

      {nextOffsetId && (
        <div className="flex justify-center">
          <Button disabled={loadingMore} onClick={loadMore} type="button" variant="outline">
            {loadingMore ? 'Loading...' : 'Load more from Telegram'}
          </Button>
        </div>
      )}
    </div>
  )
}
