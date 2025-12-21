import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Folder, MoreHorizontal, PlayCircle } from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'
import { Progress } from '@renderer/components/ui/progress'
import { cn } from '@renderer/lib/utils'

const Courses: React.FC = () => {
  const { folderPath } = useFolder()
  const navigate = useNavigate()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const loadSavedPath = async (): Promise<void> => {
      if (!folderPath || !window.api) {
        return
      }

      startTransition(async () => {
        if (!window.api) {
          return
        }

        try {
          const items = await window.api.listFolderContents(folderPath)
          setFolderItems(items || [])
        } catch (error) {
          console.error('Error loading folder contents:', error)
        }
      })
    }

    loadSavedPath()
  }, [folderPath, startTransition])

  if (isPending) {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">My Courses</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Continue learning where you left off.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folderItems.map((item) => {
            return (
              <Card
                key={item.path}
                className="group relative overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
                        'bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background'
                      )}
                    >
                      <Folder className="h-4 w-4" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-foreground line-clamp-1 mb-0.5">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.contents?.length || 0} modules
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-foreground">0%</span>
                    </div>
                    <Progress value={0} className="h-1" />
                  </div>

                  <Button
                    size="sm"
                    className="w-full gap-1.5 bg-muted text-foreground hover:bg-foreground hover:text-background border-0 transition-all duration-200 text-xs h-8"
                    variant="outline"
                    onClick={() => {
                      const encodedPath = encodeURIComponent(item.path)
                      navigate(`/courses/${encodedPath}`)
                    }}
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Continue Learning
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Courses
