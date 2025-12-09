import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { ArrowLeft, Folder, Play } from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'

const CourseModules: React.FC = () => {
  const { folderPath } = useFolder()
  const { coursePath } = useParams<{ coursePath: string }>()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [isPending, startTransition] = useTransition()

  const currentPath = coursePath ? decodeURIComponent(coursePath) : folderPath || ''

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

  const handleItemClick = async (item: FolderItem): Promise<void> => {
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

  const handleBack = (): void => {
    if (folderPath && currentPath !== folderPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/')
      if (parentPath && parentPath.startsWith(folderPath)) {
        const encodedPath = encodeURIComponent(parentPath)
        navigate(`/courses/${encodedPath}`)
      } else {
        navigate('/courses')
      }
    } else {
      navigate('/courses')
    }
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

  const folderName = currentPath.split('/').pop() || 'Módulos'

  return (
    <div className="p-6 w-full">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{folderName}</h1>
      </div>

      {folderItems.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum módulo encontrado neste curso.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {folderItems.map((item) => {
            if (item.type === 'folder') {
              const itemCount = item.contents?.length ?? 0

              return (
                <Card
                  key={item.path}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : 'Pasta'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        Abrir
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            } else if (item.type === 'video') {
              return (
                <Card
                  key={item.path}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Play className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(item.duration)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        Assistir
                      </Button>
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
  )
}

export default CourseModules
