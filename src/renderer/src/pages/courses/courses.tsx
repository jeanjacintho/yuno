import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'

interface FolderItem {
  name: string
  path: string
  type: 'folder' | 'video'
  contents?: FolderItem[]
}

interface API {
  listFolderContents: (folderPath: string) => Promise<FolderItem[]>
  selectFolder: () => Promise<string | null>
}

const Courses: React.FC = () => {
  const { folderPath } = useFolder()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const loadSavedPath = async (): Promise<void> => {
      if (!folderPath) return

      startTransition(async () => {
        try {
          const api = (window as { api: API }).api
          if (api) {
            const items = await api.listFolderContents(folderPath)
            console.log(items)
            setFolderItems(items || [])
          }
        } catch (error) {
          console.error('Error loading folder contents:', error)
        }
      })
    }

    loadSavedPath()
  }, [folderPath, startTransition])

  const getRandomGradient = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-pink-400 to-purple-500',
      'bg-gradient-to-br from-blue-400 to-cyan-500',
      'bg-gradient-to-br from-green-400 to-emerald-500',
      'bg-gradient-to-br from-yellow-400 to-orange-500',
      'bg-gradient-to-br from-indigo-400 to-purple-500',
      'bg-gradient-to-br from-rose-400 to-pink-500'
    ]
    return gradients[index % gradients.length]
  }

  if (isPending) {
    return (
      <div className="p-6 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-0 overflow-hidden">
            <Skeleton className="h-48 m-4 mb-0 rounded-lg" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto auto-rows-max">
      {folderItems.map((item, index) => {
        return (
          <Card
            key={item.path}
            className="group p-0 overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.02] max-h-min"
          >
            <div
              className={`${getRandomGradient(index)} h-48 m-2 mb-0 rounded-lg flex flex-col justify-between p-4 text-white relative overflow-hidden`}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 rounded-full bg-white/10"></div>
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div></div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{item.name}</h3>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <Button
                variant={'outline'}
                className="w-full font-medium py-2.5 transition-all duration-200"
              >
                Start course
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default Courses
