import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { ArrowLeft, Folder } from 'lucide-react'
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

  const handleItemClick = (item: FolderItem): void => {
    if (item.type === 'folder') {
      const encodedPath = encodeURIComponent(item.path)
      navigate(`/courses/${encodedPath}`)
    }
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
          {folderItems
            .filter((item) => item.type === 'folder')
            .map((item) => {
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
            })}
        </div>
      )}
    </div>
  )
}

export default CourseModules
