import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Folder, MoreHorizontal, PlayCircle, Sparkles } from 'lucide-react'
import type { FolderItem } from '../../../../shared/types/index'
import { Progress } from '@renderer/components/ui/progress'
import { cn } from '@renderer/lib/utils'

const COURSE_ACCENT_STYLES = [
  'bg-sky-200/90 text-sky-900 ring-sky-300/50',
  'bg-lime-200/90 text-lime-900 ring-lime-300/50',
  'bg-violet-200/90 text-violet-900 ring-violet-300/50',
  'bg-amber-200/90 text-amber-900 ring-amber-300/50',
  'bg-rose-200/90 text-rose-900 ring-rose-300/50',
  'bg-cyan-200/90 text-cyan-900 ring-cyan-300/50'
] as const

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
      <div className="min-h-screen w-full bg-[linear-gradient(180deg,var(--background)_0%,#dfe8f2_100%)] p-4">
        <div className="max-w-7xl mx-auto space-y-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--background)_0%,#dfe8f2_100%)] p-4">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-foreground flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-lime-200/90 text-lime-900 ring-2 ring-lime-400/50">
                <Sparkles className="size-5" />
              </span>
              Meus cursos
            </h1>
            <p className="text-sm font-semibold text-muted-foreground">
              Continue de onde parou e ganhe XP a cada aula.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folderItems.map((item, index) => {
            const accentClass = COURSE_ACCENT_STYLES[index % COURSE_ACCENT_STYLES.length]
            return (
              <Card
                key={item.path}
                className="group yuno-surface border-border/90 ring-primary/0 transition-all duration-200 hover:ring-2 hover:ring-primary/30"
              >
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-2xl ring-2 transition-transform',
                        'group-hover:scale-105',
                        accentClass
                      )}
                    >
                      <Folder className="h-5 w-5" />
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
                    <h3 className="text-foreground mb-0.5 line-clamp-1 text-base font-extrabold">
                      {item.name}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.contents?.length || 0} módulos
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-muted-foreground flex justify-between text-xs font-extrabold">
                      <span>Progresso</span>
                      <span className="text-foreground">0%</span>
                    </div>
                    <Progress value={0} className="h-2.5" />
                  </div>

                  <Button
                    size="sm"
                    className="h-9 w-full gap-2 normal-case"
                    variant="default"
                    onClick={() => {
                      const encodedPath = encodeURIComponent(item.path)
                      navigate(`/courses/${encodedPath}`)
                    }}
                  >
                    <PlayCircle className="size-4" />
                    Continuar
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
