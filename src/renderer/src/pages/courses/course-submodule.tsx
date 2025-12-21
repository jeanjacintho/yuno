import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { Play, ChevronDown, ArrowLeft, FileText, Clock } from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'
import { cn } from '@renderer/lib/utils'

const CourseSubmodule: React.FC = () => {
  const { folderPath } = useFolder()
  const { coursePath } = useParams<{ coursePath: string }>()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<string>>(new Set())
  const [videoContents, setVideoContents] = useState<Record<string, FolderItem[]>>({})

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
          if (folderPath && window.api.getIndexedFolder) {
            const indexed = await window.api.getIndexedFolder(folderPath, currentPath)
            if (indexed && indexed.length > 0) {
              setFolderItems(indexed)
              return
            }
          }

          const items = await window.api.listFolderContents(currentPath)
          setFolderItems(items || [])
        } catch (error) {
          console.error('Error loading course content:', error)
        }
      })
    }

    loadCourseContent()
  }, [currentPath, folderPath, startTransition])

  const handleToggleSubmodule = async (submodulePath: string, isOpen: boolean): Promise<void> => {
    if (isOpen) {
      setExpandedSubmodules((prev) => new Set(prev).add(submodulePath))

      if (!videoContents[submodulePath] && window.api) {
        try {
          let subItems: FolderItem[] = []

          if (folderPath && window.api.getIndexedFolder) {
            const indexed = await window.api.getIndexedFolder(folderPath, submodulePath)
            if (indexed && indexed.length > 0) {
              subItems = indexed
            }
          }

          if (subItems.length === 0) {
            subItems = await window.api.listFolderContents(submodulePath, true)
          }

          setVideoContents((prev) => ({
            ...prev,
            [submodulePath]: subItems
          }))
        } catch (error) {
          console.error('Error loading video contents:', error)
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
                    <Card className="rounded-lg overflow-hidden w-full">
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
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0">
                          <div className="space-y-0.5 pt-1">
                            {videos.length === 0 ? (
                              <p className="text-xs text-muted-foreground pl-10">Empty folder</p>
                            ) : (
                              videos.map((video) => (
                                <div
                                  key={video.path}
                                  onClick={() => video.type === 'video' && handleVideoClick(video)}
                                  className={cn(
                                    'flex items-center gap-4 px-4 py-2 rounded pl-10 cursor-pointer transition-colors',
                                    'hover:bg-muted'
                                  )}
                                >
                                  {video.type === 'video' ? (
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Play className="h-3 w-3 text-primary ml-0.5" />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                      <FileText className="h-3 w-3 text-muted-foreground" />
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
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              } else if (item.type === 'video') {
                return (
                  <div
                    key={item.path}
                    onClick={() => handleVideoClick(item)}
                    className="group bg-card rounded-lg border border-border shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all w-full"
                  >
                    <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Play className="h-4 w-4 ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDuration(item.duration)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-7 text-xs"
                    >
                      Start
                    </Button>
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
