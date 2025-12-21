import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'

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
    const getAllVideosRecursively = async (path: string): Promise<FolderItem[]> => {
      if (!window.api || !path) {
        return []
      }

      try {
        let items: FolderItem[] = []

        if (folderPath && window.api.getIndexedFolder) {
          const indexed = await window.api.getIndexedFolder(folderPath, path)
          if (indexed && indexed.length > 0) {
            items = indexed
          }
        }

        if (items.length === 0) {
          items = await window.api.listFolderContents(path)
        }

        const videos: FolderItem[] = []

        // Função auxiliar para processar recursivamente
        const processItems = (itemList: FolderItem[]): void => {
          for (const item of itemList) {
            if (item.type === 'video') {
              videos.push(item)
            } else if (item.type === 'folder' && item.contents) {
              processItems(item.contents)
            }
          }
        }

        processItems(items)
        return videos
      } catch (error) {
        console.error('Error getting videos recursively:', error)
        return []
      }
    }

    const loadVideos = async (): Promise<void> => {
      if (!window.api) {
        return
      }

      startTransition(async () => {
        if (!window.api) {
          return
        }

        try {
          // Se temos um videoPath, tenta carregar o vídeo diretamente
          if (currentVideoPath) {
            try {
              // Obtém o diretório pai do vídeo
              const parentDir = currentVideoPath.substring(0, currentVideoPath.lastIndexOf('/'))
              const videoName = currentVideoPath.substring(currentVideoPath.lastIndexOf('/') + 1)

              // Lista o conteúdo do diretório pai
              let parentItems: FolderItem[] = []

              if (folderPath && window.api.getIndexedFolder) {
                const indexed = await window.api.getIndexedFolder(folderPath, parentDir)
                if (indexed && indexed.length > 0) {
                  parentItems = indexed
                }
              }

              if (parentItems.length === 0) {
                parentItems = await window.api.listFolderContents(parentDir)
              }

              // Procura o vídeo na lista
              const directVideo = parentItems.find(
                (item) => item.path === currentVideoPath && item.type === 'video'
              )

              if (directVideo) {
                setCurrentVideo(directVideo)
              } else {
                // Se não encontrou, cria um objeto básico do vídeo
                setCurrentVideo({
                  path: currentVideoPath,
                  name: videoName,
                  type: 'video'
                })
              }
            } catch (error) {
              console.error('Error loading video directly:', error)
              // Cria um objeto básico do vídeo como fallback
              if (currentVideoPath) {
                const videoName = currentVideoPath.substring(currentVideoPath.lastIndexOf('/') + 1)
                setCurrentVideo({
                  path: currentVideoPath,
                  name: videoName,
                  type: 'video'
                })
              }
            }
          }

          // Carrega a lista de vídeos para a sidebar
          let items: FolderItem[] = []

          if (folderPath && window.api.getIndexedFolder && currentFolderPath) {
            const indexed = await window.api.getIndexedFolder(folderPath, currentFolderPath)
            if (indexed && indexed.length > 0) {
              items = indexed
            }
          }

          if (items.length === 0 && currentFolderPath) {
            items = await window.api.listFolderContents(currentFolderPath)
          }

          // Busca todos os vídeos recursivamente
          const allVideos = await getAllVideosRecursively(currentFolderPath || folderPath || '')

          const videos =
            allVideos.length > 0
              ? allVideos.sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
                )
              : items
                  .filter((item) => item.type === 'video')
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
                  )

          setFolderItems(videos || [])

          // Se temos um videoPath mas ainda não definimos o vídeo, tenta encontrá-lo na lista
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

  const handleBack = (): void => {
    const encodedCoursePath = encodeURIComponent(currentFolderPath)
    navigate(`/courses/${encodedCoursePath}`)
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
      <div className="flex h-screen bg-background">
        <div className="w-80 border-r bg-card p-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-64 bg-card border-r border-border flex flex-col z-20">
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="w-full justify-start gap-1.5 text-muted-foreground hover:text-foreground h-8 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to List
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Current Module
              </h3>
              {folderItems.length === 0 ? (
                <div className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">No videos found.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {folderItems.map((video) => {
                    const isActive = currentVideo?.path === video.path
                    const isCompleted = false // Mock status for now

                    return (
                      <div
                        key={video.path}
                        onClick={() => handleVideoSelect(video)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-4 rounded cursor-pointer transition-all duration-200 group',
                          isActive
                            ? 'bg-muted text-foreground'
                            : 'hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <div className="flex-shrink-0">
                          {isActive ? (
                            <PlayCircle className="h-4 w-4 text-foreground fill-foreground/10" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-xs font-medium truncate leading-tight mb-0.5',
                              isActive ? 'text-foreground' : 'text-foreground/80'
                            )}
                          >
                            {video.name}
                          </p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(video.duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto space-y-3">
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Module 1</span>
                <span>/</span>
                <span className="text-foreground font-medium">
                  {currentVideo?.name || 'Select a video'}
                </span>
              </div>
              <h1 className="text-lg font-bold text-foreground">
                {currentVideo?.name || 'Video Player'}
              </h1>
            </div>

            <div className="bg-foreground rounded-lg overflow-hidden shadow-lg ring-1 ring-border aspect-video relative group">
              {currentVideo ? (
                <video
                  key={currentVideo.path}
                  controls
                  className="w-full h-full object-contain"
                  src={`file://${currentVideo.path}`}
                  preload="metadata"
                  crossOrigin="anonymous"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">No video selected</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground h-8 text-xs"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Give a hint
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
