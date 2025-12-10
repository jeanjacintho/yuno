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
import { Folder, ChevronDown, Play, Loader } from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'

const CourseModule: React.FC = () => {
  const { folderPath } = useFolder()
  const { coursePath } = useParams<{ coursePath: string }>()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [submoduleContents, setSubmoduleContents] = useState<Record<string, FolderItem[]>>({})

  const currentPath = coursePath ? decodeURIComponent(coursePath) : folderPath || ''

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
      <div className="p-6 w-full">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 w-full">
      {folderItems.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum submódulo encontrado neste módulo.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {folderItems
            .filter((item) => item.type === 'folder')
            .map((item) => {
              const itemCount = item.contents?.length ?? 0
              const isExpanded = expandedModules.has(item.path)
              const submodules = submoduleContents[item.path] || item.contents || []

              return (
                <Collapsible
                  key={item.path}
                  open={isExpanded}
                  onOpenChange={(open) => handleToggleModule(item.path, open)}
                >
                  <Card className="overflow-hidden p-0">
                    <CollapsibleTrigger className="w-full">
                      <div className="p-4 hover:bg-accent transition-colors flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex bg-muted-foreground rounded h-8 w-8 items-center justify-center">
                            <span className="text-sm">1/8</span>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                              quos.
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <ChevronDown
                              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between gap-4">
                          <div className="flex flex-col flex-1 items-start justify-center gap-2">
                            <p className="text-sm text-muted-foreground">60% completed</p>
                            <Progress value={50} className="h-2" />
                          </div>
                          <Button className="rounded-full">Start learning</Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4">
                        {submodules.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">Carregando...</p>
                        ) : (
                          <div className="space-y-2">
                            {submodules.map((submodule, index) => {
                              if (submodule.type === 'folder') {
                                const subItemCount = submodule.contents?.length ?? 0
                                return (
                                  <Card
                                    key={submodule.path}
                                    className="p-2 cursor-pointer hover:bg-accent/50 transition-colors"
                                    onClick={() => handleSubmoduleClick(submodule)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex bg-muted-foreground rounded h-8 w-8 items-center justify-center">
                                        {index + 1}
                                      </div>
                                      <div className="w-full flex justify-between min-w-0">
                                        <h4 className="font-medium text-sm">{submodule.name}</h4>
                                        <div className="flex items-center gap-2">
                                          <Loader className="h-4 w-4 text-muted-foreground animate-spin" />
                                          <span className="text-xs text-muted-foreground">
                                            8 Modules
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                )
                              } else if (submodule.type === 'video') {
                                return (
                                  <Card
                                    key={submodule.path}
                                    className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                                    onClick={() => handleSubmoduleClick(submodule)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex-shrink-0">
                                        <Play className="h-5 w-5 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm">{submodule.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDuration(submodule.duration)}
                                        </p>
                                      </div>
                                    </div>
                                  </Card>
                                )
                              }
                              return null
                            })}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
        </div>
      )}
    </div>
  )
}

export default CourseModule
