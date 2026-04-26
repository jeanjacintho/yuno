import { useFolder } from '@renderer/context/folder-context'
import { useUser } from '@renderer/context/user-context'
import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react'
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
import type { FolderItem, VideoProgressState } from '../../../../shared/types/index'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'

const VIDEO_SAVE_INTERVAL_MS = 3000
const RESUME_MIN_SECONDS = 2

const VideoPlayer: React.FC = () => {
  const { folderPath } = useFolder()
  const { user } = useUser()
  const { coursePath, videoPath } = useParams<{ coursePath: string; videoPath: string }>()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [currentVideo, setCurrentVideo] = useState<FolderItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [progressByPath, setProgressByPath] = useState<Record<string, VideoProgressState>>({})
  const [progressLoaded, setProgressLoaded] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastSaveWallClockRef = useRef(0)
  const lastPersistedTimeRef = useRef(0)
  const resumeAppliedForPathRef = useRef<string | null>(null)

  const currentFolderPath = coursePath ? decodeURIComponent(coursePath) : folderPath || ''
  const currentVideoPath = videoPath ? decodeURIComponent(videoPath) : null

  const persistProgress = useCallback(
    async (lastPositionSec: number, completed: boolean): Promise<void> => {
      if (!user || !currentVideo) {
        return
      }
      if (!window.api?.upsertVideoProgress) {
        return
      }
      const t = Math.max(0, lastPositionSec)
      const res = await window.api.upsertVideoProgress(user.id, currentVideo.path, t, completed)
      if (res.success) {
        setProgressByPath((prev) => ({
          ...prev,
          [currentVideo.path]: { lastPositionSec: t, completed }
        }))
      }
    },
    [user, currentVideo]
  )

  const maybePersistFromPlayback = useCallback(
    (force: boolean) => {
      if (!user || !currentVideo) {
        return
      }
      const el = videoRef.current
      if (!el) {
        return
      }
      const t = el.currentTime
      const d = el.duration
      if (!Number.isFinite(t)) {
        return
      }
      if (Number.isFinite(d) && d > 0 && t >= d - 0.75) {
        return
      }
      const p = progressByPath[currentVideo.path]
      if (p?.completed) {
        return
      }
      const now = Date.now()
      if (!force && now - lastSaveWallClockRef.current < VIDEO_SAVE_INTERVAL_MS) {
        return
      }
      if (!force && Math.abs(t - lastPersistedTimeRef.current) < 0.35) {
        return
      }
      lastSaveWallClockRef.current = now
      lastPersistedTimeRef.current = t
      void persistProgress(t, false)
    },
    [user, currentVideo, progressByPath, persistProgress]
  )

  useEffect(() => {
    const loadVideos = async (): Promise<void> => {
      if (!window.api) {
        return
      }

      startTransition(async () => {
        if (!window.api) {
          return
        }

        try {
          const folderToLoad = currentVideoPath
            ? currentVideoPath.substring(0, currentVideoPath.lastIndexOf('/'))
            : currentFolderPath

          if (currentVideoPath) {
            try {
              const videoName = currentVideoPath.substring(currentVideoPath.lastIndexOf('/') + 1)

              let parentItems: FolderItem[] = []

              if (folderPath && window.api.getIndexedFolder) {
                const indexed = await window.api.getIndexedFolder(folderPath, folderToLoad)
                if (indexed && indexed.length > 0) {
                  parentItems = indexed
                }
              }

              if (parentItems.length === 0) {
                parentItems = await window.api.listFolderContents(folderToLoad)
              }

              const directVideo = parentItems.find(
                (item) => item.path === currentVideoPath && item.type === 'video'
              )

              if (directVideo) {
                setCurrentVideo(directVideo)
              } else {
                setCurrentVideo({
                  path: currentVideoPath,
                  name: videoName,
                  type: 'video'
                })
              }
            } catch (error) {
              console.error('Error loading video directly:', error)
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

          let items: FolderItem[] = []

          if (window.api.getVideosByFolderPath && folderToLoad) {
            const dbItems = await window.api.getVideosByFolderPath(folderToLoad)
            if (dbItems && dbItems.length > 0) {
              items = dbItems
            }
          }

          if (items.length === 0 && folderPath && window.api.getIndexedFolder && folderToLoad) {
            const indexed = await window.api.getIndexedFolder(folderPath, folderToLoad)
            if (indexed && indexed.length > 0) {
              items = indexed
              const videosWithoutDuration = items.filter(
                (item) => item.type === 'video' && !item.duration
              )
              if (videosWithoutDuration.length > 0 && window.api.listFolderContents) {
                const enrichedItems = await window.api.listFolderContents(folderToLoad, true)
                const enrichedMap = new Map(enrichedItems.map((item) => [item.path, item.duration]))
                items = items.map((item) => {
                  if (item.type === 'video' && !item.duration) {
                    return {
                      ...item,
                      duration: enrichedMap.get(item.path)
                    }
                  }
                  return item
                })
              }
            }
          }

          if (items.length === 0 && folderToLoad) {
            items = await window.api.listFolderContents(folderToLoad, true)
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

  useEffect(() => {
    if (!user) {
      setProgressByPath({})
      setProgressLoaded(true)
      return
    }
    const batchApi = window.api?.getVideoProgressBatch
    if (!batchApi) {
      setProgressLoaded(true)
      return
    }
    const pathsFromList = folderItems.map((v) => v.path)
    const paths =
      currentVideoPath && !pathsFromList.includes(currentVideoPath)
        ? [...pathsFromList, currentVideoPath]
        : pathsFromList
    if (paths.length === 0) {
      setProgressByPath({})
      setProgressLoaded(true)
      return
    }
    setProgressLoaded(false)
    void batchApi(user.id, paths).then((map) => {
      setProgressByPath(map)
      setProgressLoaded(true)
    })
  }, [user, folderItems, currentVideoPath])

  useEffect(() => {
    resumeAppliedForPathRef.current = null
  }, [currentVideo?.path])

  const applyResumePosition = useCallback(
    (el: HTMLVideoElement): void => {
      if (!currentVideo || !progressLoaded) {
        return
      }
      if (resumeAppliedForPathRef.current === currentVideo.path) {
        return
      }
      const p = progressByPath[currentVideo.path]
      resumeAppliedForPathRef.current = currentVideo.path
      if (p?.completed) {
        el.currentTime = 0
        return
      }
      if (p && p.lastPositionSec >= RESUME_MIN_SECONDS) {
        const d = el.duration
        if (d > 0) {
          el.currentTime = Math.min(p.lastPositionSec, Math.max(0, d - 0.5))
        } else {
          el.currentTime = p.lastPositionSec
        }
      }
    },
    [currentVideo, progressByPath, progressLoaded]
  )

  useEffect(() => {
    if (!progressLoaded) {
      return
    }
    const el = videoRef.current
    if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applyResumePosition(el)
    }
  }, [progressLoaded, currentVideo?.path, progressByPath, applyResumePosition])

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

  const currentIndex = currentVideo
    ? folderItems.findIndex((v) => v.path === currentVideo.path)
    : -1
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex >= 0 && currentIndex < folderItems.length - 1

  const handlePrev = (): void => {
    if (canGoPrev) {
      void persistProgress(videoRef.current?.currentTime ?? lastPersistedTimeRef.current, false)
      handleVideoSelect(folderItems[currentIndex - 1])
    }
  }

  const handleNext = (): void => {
    if (canGoNext) {
      void persistProgress(videoRef.current?.currentTime ?? lastPersistedTimeRef.current, false)
      handleVideoSelect(folderItems[currentIndex + 1])
    }
  }

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>): void => {
    applyResumePosition(e.currentTarget)
  }

  const handleTimeUpdate = (): void => {
    maybePersistFromPlayback(false)
  }

  const handleVideoPause = (): void => {
    maybePersistFromPlayback(true)
  }

  const handleVideoEnded = async (): Promise<void> => {
    if (user && currentVideo) {
      const el = videoRef.current
      const endTime =
        el && Number.isFinite(el.duration) && el.duration > 0 ? el.duration : (el?.currentTime ?? 0)
      await persistProgress(endTime, true)
    }
    if (currentIndex >= 0 && currentIndex < folderItems.length - 1) {
      handleVideoSelect(folderItems[currentIndex + 1])
    }
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
                    const p = progressByPath[video.path]
                    const isCompleted = Boolean(p?.completed)
                    const inProgress = Boolean(
                      p && !p.completed && p.lastPositionSec >= RESUME_MIN_SECONDS
                    )

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
                          ) : inProgress ? (
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
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
                  ref={videoRef}
                  key={currentVideo.path}
                  controls
                  className="w-full h-full object-contain"
                  src={`file://${currentVideo.path}`}
                  preload="metadata"
                  crossOrigin="anonymous"
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  disabled={!canGoPrev}
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  disabled={!canGoNext}
                  onClick={handleNext}
                >
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
