import { useEffect, useRef } from 'react'
import { ArrowLeftIcon, CircleCheckIcon, ExternalLinkIcon } from 'lucide-react'
import { api, type MediaItem } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle
} from '@/components/ui/card'

type MediaPlayerProps = {
  chatId: string
  item: MediaItem
  watched: boolean
  onWatchedChange: (messageId: string, watched: boolean) => void
  onBack: () => void
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

export function MediaPlayer({
  chatId,
  item,
  watched,
  onWatchedChange,
  onBack
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamUrl = api.streamUrl(chatId, item.messageId)

  useEffect(() => {
    if (item.type !== 'video' || !videoRef.current) return

    const video = videoRef.current
    const messageId = item.messageId

    function handleTimeUpdate() {
      if (!video.duration || watched) return

      const progress = video.currentTime / video.duration
      if (progress >= 0.9) {
        onWatchedChange(messageId, true)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [item, watched, onWatchedChange])

  return (
    <div className="flex w-full flex-col gap-4">
      <Button className="w-fit" onClick={onBack} type="button" variant="ghost">
        <ArrowLeftIcon data-icon="inline-start" />
        Back to list
      </Button>

      <Card>
        <CardContent>
          {item.type === 'video' && (
            <div className="overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className="aspect-video w-full"
                controls
                src={streamUrl}
              />
            </div>
          )}

          {item.type === 'pdf' && (
            <div className="overflow-hidden rounded-lg border">
              <iframe
                className="aspect-video w-full bg-background"
                src={streamUrl}
                title={item.fileName}
              />
            </div>
          )}

          {item.type === 'photo' && (
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              <img
                alt={item.fileName}
                className="mx-auto max-h-[70vh] w-full object-contain"
                src={streamUrl}
              />
            </div>
          )}

          {item.type === 'document' && (
            <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/30 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Preview is not available for this file type.
              </p>
              <Button render={<a href={streamUrl} rel="noreferrer" target="_blank" />}>
                <ExternalLinkIcon data-icon="inline-start" />
                Open file
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col items-start gap-3">
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-lg">{item.fileName}</CardTitle>
              <CardDescription>
                {formatDate(item.date)} · {formatFileSize(item.size)}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {item.type}
              </Badge>
              {watched && (
                <Badge variant="outline" className="text-muted-foreground">
                  <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
                  Watched
                </Badge>
              )}
              <Button
                onClick={() => onWatchedChange(item.messageId, !watched)}
                type="button"
                variant={watched ? 'secondary' : 'outline'}
                size="sm"
              >
                {watched ? 'Mark as pending' : 'Mark as watched'}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
