import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Play } from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'

const VideoPlayer: React.FC = () => {
  const { folderPath } = useFolder()
  const { coursePath, videoPath } = useParams<{ coursePath: string; videoPath: string }>()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [currentVideo, setCurrentVideo] = useState<FolderItem | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentFolderPath = coursePath ? decodeURIComponent(coursePath) : folderPath || ''
  const currentVideoPath = videoPath ? decodeURIComponent(videoPath) : null

  useEffect(() => {
    const loadVideos = async (): Promise<void> => {
      if (!currentFolderPath || !window.api) {
        return
      }

      startTransition(async () => {
        if (!window.api) {
          return
        }

        try {
          let items: FolderItem[] = []

          if (folderPath && window.api.getIndexedFolder) {
            const indexed = await window.api.getIndexedFolder(folderPath, currentFolderPath)
            if (indexed && indexed.length > 0) {
              items = indexed
            }
          }

          if (items.length === 0) {
            items = await window.api.listFolderContents(currentFolderPath)
          }

          const videos = items
            .filter((item) => item.type === 'video')
            .sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
            )
          setFolderItems(videos || [])

          if (currentVideoPath) {
            const video = videos.find((v) => v.path === currentVideoPath)
            if (video) {
              setCurrentVideo(video)
            } else if (videos.length > 0) {
              setCurrentVideo(videos[0])
            }
          } else if (videos.length > 0) {
            setCurrentVideo(videos[0])
          }
        } catch (error) {
          console.error('Error loading videos:', error)
        }
      })
    }

    loadVideos()
  }, [currentFolderPath, currentVideoPath, folderPath, startTransition])

  const handleVideoSelect = (video: FolderItem): void => {
    if (video.type === 'video') {
      const encodedCoursePath = encodeURIComponent(currentFolderPath)
      const encodedVideoPath = encodeURIComponent(video.path)
      navigate(`/courses/${encodedCoursePath}/video/${encodedVideoPath}`)
      setCurrentVideo(video)
    }
  }

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (isPending) {
    return (
      <div className="flex h-full w-full">
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="aspect-video w-full" />
        </div>
        <div className="w-80 border-l p-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-center bg-black aspect-video w-full">
          {currentVideo ? (
            <video
              key={currentVideo.path}
              controls
              className="w-full h-full object-contain"
              src={`file://${currentVideo.path}`}
              preload="metadata"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('Video playback error:', e)
                console.error('Video source:', currentVideo.path)
                const videoElement = e.currentTarget
                console.error('Video error code:', videoElement.error?.code)
                console.error('Video error message:', videoElement.error?.message)
              }}
              onLoadStart={() => {
                console.log('Video loading started:', currentVideo.path)
              }}
              onCanPlay={() => {
                console.log('Video can play:', currentVideo.path)
              }}
            >
              Seu navegador não suporta a tag de vídeo.
            </video>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Nenhum vídeo selecionado</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-80 bg-background flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-2">
            {folderItems.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum vídeo encontrado nesta pasta.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {folderItems.map((video) => {
                  const isActive = currentVideo?.path === video.path

                  return (
                    <div
                      key={video.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent/50 text-foreground'
                      }`}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <Play
                        className={`h-4 w-4 flex-shrink-0 ${
                          isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      />
                      <span className={`flex-1 text-sm truncate ${isActive ? 'font-medium' : ''}`}>
                        {video.name}
                      </span>
                      <span
                        className={`text-xs flex-shrink-0 ${
                          isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {formatDuration(video.duration)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
