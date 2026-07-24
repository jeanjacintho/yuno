import { useEffect, useRef } from 'react'
import { api, type MediaItem } from '../lib/api'

type MediaPlayerProps = {
  chatId: string
  item: MediaItem | null
  watched: boolean
  onWatchedChange: (messageId: string, watched: boolean) => void
  onClose: () => void
}

export function MediaPlayer({
  chatId,
  item,
  watched,
  onWatchedChange,
  onClose
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!item || item.type !== 'video' || !videoRef.current) return

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

  if (!item) return null

  const streamUrl = api.streamUrl(chatId, item.messageId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">{item.fileName}</h2>
            <p className="text-xs uppercase text-slate-500">{item.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                watched
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'border border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
              onClick={() => onWatchedChange(item.messageId, !watched)}
              type="button"
            >
              {watched ? 'Watched' : 'Mark as watched'}
            </button>
            <button
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-black p-4">
          {item.type === 'video' && (
            <video
              ref={videoRef}
              className="max-h-[70vh] w-full"
              controls
              src={streamUrl}
            />
          )}

          {item.type === 'pdf' && (
            <iframe
              className="h-[70vh] w-full rounded-lg bg-white"
              src={streamUrl}
              title={item.fileName}
            />
          )}

          {(item.type === 'photo' || item.type === 'document') && (
            <div className="flex flex-col items-center gap-4 text-center">
              {item.type === 'photo' ? (
                <img
                  alt={item.fileName}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain"
                  src={streamUrl}
                />
              ) : (
                <p className="text-sm text-slate-400">
                  Preview is not available for this file type.
                </p>
              )}
              <a
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium transition hover:bg-violet-500"
                href={streamUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
