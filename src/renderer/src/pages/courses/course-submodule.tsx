import { useFolder } from '@renderer/context/folder-context'
import { useUser } from '@renderer/context/user-context'
import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { Play, ChevronDown, ArrowLeft, Clock, Loader, CheckCircle2 } from 'lucide-react'
import type { FolderItem, VideoProgressState } from '../../../../shared/types/index'
import { cn } from '@renderer/lib/utils'

const RESUME_MIN_SECONDS = 2

const CourseSubmodule: React.FC = () => {
  const { folderPath } = useFolder()
  const { user } = useUser()
  const { coursePath } = useParams<{ coursePath: string }>()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<string>>(new Set())
  const [videoContents, setVideoContents] = useState<Record<string, FolderItem[]>>({})
  const [loadingContents, setLoadingContents] = useState<Set<string>>(new Set())
  const [videoProgressByPath, setVideoProgressByPath] = useState<
    Record<string, VideoProgressState>
  >({})

  const currentPath = coursePath ? decodeURIComponent(coursePath) : folderPath || ''
  const title = currentPath.split('/').pop() || 'Module Content'

  useEffect(() => {
    const loadCourseContent = async (): Promise<void> => {
      if (!currentPath || !window.api) {
        return
      }

      startTransition(async () => {
        if (!window.api) {
          return
        }

        try {
          let items: FolderItem[] = []

          // Tenta primeiro buscar do banco de dados
          if (folderPath && window.api.getIndexedFolder) {
            const indexed = await window.api.getIndexedFolder(folderPath, currentPath)
            if (indexed && indexed.length > 0) {
              items = indexed
            }
          }

          // Se não encontrou no banco, lê do sistema de arquivos
          if (items.length === 0) {
            items = await window.api.listFolderContents(currentPath)

            // Salva no banco para próxima vez
            if (items.length > 0 && folderPath && window.api.saveCourseStructure) {
              // Salva apenas se for a pasta raiz do curso
              if (currentPath === folderPath) {
                window.api.saveCourseStructure(folderPath, items).catch((error) => {
                  console.error('Error saving course structure:', error)
                })
              }
            }
          }

          setFolderItems(items || [])

          // Inicia o carregamento das pastas em paralelo, sem bloquear
          const folders = items.filter((item) => item.type === 'folder')

          // Cada pasta é carregada de forma independente (como uma "thread")
          folders.forEach((folder) => {
            // Se já tem conteúdo carregado, não precisa carregar novamente
            if (folder.contents) {
              return
            }

            // Carrega cada pasta de forma assíncrona e independente
            ;(async () => {
              if (!window.api) {
                return
              }

              // Marca como carregando
              setLoadingContents((prev) => new Set(prev).add(folder.path))

              try {
                let subItems: FolderItem[] = []

                // Tenta primeiro buscar do banco de dados
                if (window.api.getVideosByFolderPath) {
                  const dbItems = await window.api.getVideosByFolderPath(folder.path)
                  if (dbItems && dbItems.length > 0) {
                    subItems = dbItems
                  }
                }

                // Se não encontrou no banco, tenta pelo método antigo
                if (subItems.length === 0 && folderPath && window.api.getIndexedFolder) {
                  const indexed = await window.api.getIndexedFolder(folderPath, folder.path)
                  if (indexed && indexed.length > 0) {
                    subItems = indexed
                  }
                }

                // Se ainda não encontrou, lê do sistema de arquivos
                if (subItems.length === 0 && window.api.listFolderContents) {
                  subItems = await window.api.listFolderContents(folder.path, true)
                }

                setVideoContents((prev) => ({
                  ...prev,
                  [folder.path]: subItems
                }))
              } catch (error) {
                console.error(`Error loading contents for folder ${folder.path}:`, error)
              } finally {
                // Remove do estado de carregando
                setLoadingContents((prev) => {
                  const newSet = new Set(prev)
                  newSet.delete(folder.path)
                  return newSet
                })
              }
            })()
          })
        } catch (error) {
          console.error('Error loading course content:', error)
        }
      })
    }

    loadCourseContent()
  }, [currentPath, folderPath, startTransition])

  const allVideoPaths = useMemo((): string[] => {
    const out: string[] = []
    for (const it of folderItems) {
      if (it.type === 'video') {
        out.push(it.path)
      } else if (it.type === 'folder') {
        const vids = videoContents[it.path] || it.contents || []
        for (const v of vids) {
          if (v.type === 'video') {
            out.push(v.path)
          }
        }
      }
    }
    return out
  }, [folderItems, videoContents])

  useEffect(() => {
    if (!user || allVideoPaths.length === 0) {
      setVideoProgressByPath({})
      return
    }
    if (!window.api?.getVideoProgressBatch) {
      return
    }
    void window.api.getVideoProgressBatch(user.id, allVideoPaths).then(setVideoProgressByPath)
  }, [user, allVideoPaths])

  const handleToggleSubmodule = async (submodulePath: string, isOpen: boolean): Promise<void> => {
    if (isOpen) {
      setExpandedSubmodules((prev) => new Set(prev).add(submodulePath))

      if (!videoContents[submodulePath] && window.api) {
        // Marca como carregando
        setLoadingContents((prev) => new Set(prev).add(submodulePath))

        try {
          let subItems: FolderItem[] = []

          // Tenta primeiro buscar do banco de dados
          if (window.api.getVideosByFolderPath) {
            const dbItems = await window.api.getVideosByFolderPath(submodulePath)
            if (dbItems && dbItems.length > 0) {
              subItems = dbItems
            }
          }

          // Se não encontrou no banco, tenta pelo método antigo
          if (subItems.length === 0 && folderPath && window.api.getIndexedFolder) {
            const indexed = await window.api.getIndexedFolder(folderPath, submodulePath)
            if (indexed && indexed.length > 0) {
              subItems = indexed
            }
          }

          // Se ainda não encontrou, lê do sistema de arquivos
          if (subItems.length === 0) {
            subItems = await window.api.listFolderContents(submodulePath, true)
          }

          setVideoContents((prev) => ({
            ...prev,
            [submodulePath]: subItems
          }))
        } catch (error) {
          console.error('Error loading video contents:', error)
        } finally {
          // Remove do estado de carregando
          setLoadingContents((prev) => {
            const newSet = new Set(prev)
            newSet.delete(submodulePath)
            return newSet
          })
        }
      }
    } else {
      setExpandedSubmodules((prev) => {
        const newSet = new Set(prev)
        newSet.delete(submodulePath)
        return newSet
      })
    }
  }

  const handleVideoClick = (video: FolderItem): void => {
    const encodedCoursePath = encodeURIComponent(currentPath)
    const encodedVideoPath = encodeURIComponent(video.path)
    navigate(`/courses/${encodedCoursePath}/video/${encodedVideoPath}`)
  }

  const handleBack = (): void => {
    // Navigate up one level
    // Assuming simple path structure where we can just go back in browser history or reconstruct parent path
    navigate(-1)
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

  const getLessonProgress = (path: string): VideoProgressState | undefined =>
    videoProgressByPath[path]

  const isLessonInProgress = (p: VideoProgressState | undefined): boolean =>
    Boolean(p && !p.completed && p.lastPositionSec >= RESUME_MIN_SECONDS)

  const isLessonComplete = (p: VideoProgressState | undefined): boolean => Boolean(p?.completed)

  if (isPending) {
    return (
      <div className="p-6 w-full space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 w-full">
      <div className="w-full space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">Select a lesson to start watching.</p>
          </div>
        </div>

        <div className="space-y-4 w-full">
          {folderItems.length === 0 ? (
            <Card className="p-6 text-center border-dashed w-full">
              <p className="text-sm text-muted-foreground">No content found in this module.</p>
            </Card>
          ) : (
            folderItems.map((item, index) => {
              if (item.type === 'folder') {
                const isExpanded = expandedSubmodules.has(item.path)
                const videos = videoContents[item.path] || item.contents || []

                return (
                  <Collapsible
                    key={item.path}
                    open={isExpanded}
                    onOpenChange={(open) => handleToggleSubmodule(item.path, open)}
                    className="w-full"
                  >
                    <Card className="rounded-lg overflow-hidden w-full py-0">
                      <CollapsibleTrigger className="w-full">
                        <div className="p-4 flex items-center gap-4 hover:bg-muted transition-colors">
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-muted-foreground font-medium text-xs">
                            {index + 1}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {videos.length > 0 ? `${videos.length} lessons` : 'Folder'}
                            </p>
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0',
                              isExpanded ? 'rotate-180' : ''
                            )}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pb-0">
                        <div className="space-y-0.5">
                          {loadingContents.has(item.path) && videos.length === 0 ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 pl-10">
                              <Loader className="h-3 w-3 animate-spin" />
                              Loading contents...
                            </div>
                          ) : videos.length === 0 ? (
                            <p className="text-xs text-muted-foreground pl-10 py-2">Empty folder</p>
                          ) : (
                            videos.map((video) => {
                              if (video.type !== 'video') {
                                return null
                              }
                              const progress = getLessonProgress(video.path)
                              const done = isLessonComplete(progress)
                              const inProgress = isLessonInProgress(progress)
                              return (
                                <div
                                  key={video.path}
                                  onClick={() => handleVideoClick(video)}
                                  className={cn(
                                    'flex items-center gap-3 px-4 py-2 rounded pl-10 cursor-pointer transition-colors',
                                    'hover:bg-muted'
                                  )}
                                >
                                  {done ? (
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                  ) : inProgress ? (
                                    <div className="h-6 w-6 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                      <Clock className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Play className="h-3 w-3 text-primary ml-0.5" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-medium text-foreground truncate">
                                      {video.name}
                                    </h4>
                                    {video.duration && (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {formatDuration(video.duration)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {inProgress ? (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      className="h-7 text-xs flex-shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleVideoClick(video)
                                      }}
                                    >
                                      Retomar
                                    </Button>
                                  ) : done ? (
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0 pr-1">
                                      Concluída
                                    </span>
                                  ) : null}
                                </div>
                              )
                            })
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              } else if (item.type === 'video') {
                const topProgress = getLessonProgress(item.path)
                const topDone = isLessonComplete(topProgress)
                const topInProgress = isLessonInProgress(topProgress)
                return (
                  <div
                    key={item.path}
                    onClick={() => handleVideoClick(item)}
                    className="group bg-card rounded-lg border border-border shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all w-full"
                  >
                    {topDone ? (
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                    ) : topInProgress ? (
                      <div className="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Play className="h-4 w-4 ml-0.5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDuration(item.duration)}
                      </p>
                    </div>
                    {topInProgress ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVideoClick(item)
                        }}
                      >
                        Retomar
                      </Button>
                    ) : topDone ? (
                      <span className="text-xs text-muted-foreground">Concluída</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-7 text-xs"
                      >
                        Iniciar
                      </Button>
                    )}
                  </div>
                )
              }
              return null
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseSubmodule
