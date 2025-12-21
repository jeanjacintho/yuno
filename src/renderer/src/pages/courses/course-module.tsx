import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { Folder, ChevronDown, Loader, CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { cn } from '@renderer/lib/utils'

const CourseModule: React.FC = () => {
  const { folderPath } = useFolder()
  const { coursePath } = useParams<{ coursePath: string }>()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [submoduleContents, setSubmoduleContents] = useState<Record<string, FolderItem[]>>({})

  const currentPath = coursePath ? decodeURIComponent(coursePath) : folderPath || ''
  const courseName = currentPath.split('/').pop() || 'Course Content'

  useEffect(() => {
    const loadModuleContent = async (): Promise<void> => {
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
          console.error('Error loading module content:', error)
        }
      })
    }

    loadModuleContent()
  }, [currentPath, folderPath, startTransition])

  const handleToggleModule = async (modulePath: string, isOpen: boolean): Promise<void> => {
    if (isOpen) {
      setExpandedModules((prev) => new Set(prev).add(modulePath))

      if (!submoduleContents[modulePath] && window.api) {
        try {
          let subItems: FolderItem[] = []

          if (folderPath && window.api.getIndexedFolder) {
            const indexed = await window.api.getIndexedFolder(folderPath, modulePath)
            if (indexed && indexed.length > 0) {
              subItems = indexed
            }
          }

          if (subItems.length === 0) {
            subItems = await window.api.listFolderContents(modulePath)
          }

          setSubmoduleContents((prev) => ({
            ...prev,
            [modulePath]: subItems
          }))
        } catch (error) {
          console.error('Error loading submodule contents:', error)
        }
      }
    } else {
      setExpandedModules((prev) => {
        const newSet = new Set(prev)
        newSet.delete(modulePath)
        return newSet
      })
    }
  }

  const handleSubmoduleClick = async (item: FolderItem): Promise<void> => {
    if (item.type === 'folder') {
      if (!window.api) {
        return
      }

      try {
        let folderContents: FolderItem[] = []

        if (folderPath && window.api.getIndexedFolder) {
          const indexed = await window.api.getIndexedFolder(folderPath, item.path)
          if (indexed && indexed.length > 0) {
            folderContents = indexed
          }
        }

        if (folderContents.length === 0) {
          folderContents = await window.api.listFolderContents(item.path)
        }

        const videos = folderContents.filter((content) => content.type === 'video')

        if (videos.length > 0) {
          const firstVideo = videos[0]
          const encodedCoursePath = encodeURIComponent(item.path)
          const encodedVideoPath = encodeURIComponent(firstVideo.path)
          navigate(`/courses/${encodedCoursePath}/video/${encodedVideoPath}`)
        } else {
          const encodedPath = encodeURIComponent(item.path)
          navigate(`/courses/${encodedPath}`)
        }
      } catch (error) {
        console.error('Error checking folder contents:', error)
        const encodedPath = encodeURIComponent(item.path)
        navigate(`/courses/${encodedPath}`)
      }
    } else if (item.type === 'video') {
      const encodedCoursePath = encodeURIComponent(currentPath)
      const encodedVideoPath = encodeURIComponent(item.path)
      navigate(`/courses/${encodedCoursePath}/video/${encodedVideoPath}`)
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
      <div className="w-full p-4 space-y-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <div className="flex-1 w-full space-y-4 p-4">
        <Card className="rounded-xl p-4 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                <span>Course</span>
                <span>•</span>
                <span>{folderItems.length} modules</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{courseName}</h1>
              <p className="text-sm text-muted-foreground max-w-xl line-clamp-2">
                Master the principles and build a strong foundation for your journey. Explore core
                concepts that shape effective understanding.
              </p>

              <div className="space-y-1 pt-2 max-w-md">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">60% done</span>
                  <span className="text-muted-foreground">2 weeks left</span>
                </div>
                <Progress value={60} className="h-1" />
              </div>
            </div>

            <div className="flex items-end md:items-start">
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 px-4 py-2 text-sm font-medium transition-all"
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {folderItems.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <div className="flex justify-center mb-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Empty Course</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                No modules found in this course.
              </p>
            </Card>
          ) : (
            folderItems
              .filter((item) => item.type === 'folder')
              .map((item, index) => {
                const isExpanded = expandedModules.has(item.path)
                const submodules = submoduleContents[item.path] || item.contents || []
                const itemCount = item.contents?.length ?? 0

                return (
                  <Collapsible
                    key={item.path}
                    open={isExpanded}
                    onOpenChange={(open) => handleToggleModule(item.path, open)}
                  >
                    <Card className="rounded-lg transition-all duration-200 hover:shadow-sm p-0">
                      <CollapsibleTrigger className="w-full">
                        <div className="p-4 flex items-center gap-4">
                          {/* Number Box */}
                          <div
                            className={cn(
                              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-semibold text-sm transition-colors',
                              isExpanded
                                ? 'bg-foreground text-background'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {index + 1}
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              Module description and key learning outcomes.
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              {index === 0 ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/50" />
                              )}
                              <span className="hidden md:inline text-xs">
                                {index === 0 ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                            <div className="hidden md:flex items-center min-w-[60px]">
                              <span className="font-medium text-foreground text-xs">
                                {itemCount || '0'} tasks
                              </span>
                            </div>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform duration-200 flex-shrink-0',
                                isExpanded ? 'rotate-180 text-foreground' : 'text-muted-foreground'
                              )}
                            />
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0 ml-[2.5rem]">
                          <div className="space-y-1 border-l-2 border-border pl-4 py-2">
                            {submodules.length === 0 ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                <Loader className="h-3 w-3 animate-spin" />
                                Loading contents...
                              </div>
                            ) : (
                              submodules.map((submodule) => (
                                <div
                                  key={submodule.path}
                                  className="group flex items-center justify-between px-4 py-2 rounded hover:bg-muted cursor-pointer transition-colors"
                                  onClick={() => handleSubmoduleClick(submodule)}
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div
                                      className={cn(
                                        'h-1.5 w-1.5 rounded-full transition-colors flex-shrink-0',
                                        submodule.type === 'video'
                                          ? 'bg-primary'
                                          : 'bg-muted-foreground/30',
                                        'group-hover:scale-125'
                                      )}
                                    />
                                    <span className="text-xs font-medium text-foreground truncate">
                                      {submodule.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 flex-shrink-0">
                                    {submodule.type === 'video' && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        {formatDuration(submodule.duration)}
                                      </span>
                                    )}
                                    <ArrowRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
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
              })
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseModule
