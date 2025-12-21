import { useFolder } from '@renderer/context/folder-context'
import React, { useEffect, useState, useTransition } from 'react'
import { useParams } from 'react-router-dom'
import { Skeleton } from '@renderer/components/ui/skeleton'
import CourseModule from './course-module'
import CourseSubmodule from './course-submodule'
import type { FolderItem } from '../../../../shared/types/index'

const CourseContentRouter: React.FC = () => {
  const { folderPath } = useFolder()
  const { coursePath } = useParams<{ coursePath: string }>()
  const [isModule, setIsModule] = useState<boolean | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentPath = coursePath ? decodeURIComponent(coursePath) : folderPath || ''

  useEffect(() => {
    const determinePageType = async (): Promise<void> => {
      if (!currentPath || !folderPath || !window.api) {
        setIsModule(false)
        return
      }

      startTransition(async () => {
        if (!window.api) {
          setIsModule(false)
          return
        }

        try {
          let items: FolderItem[] = []
          let isFromIndex = false

          if (folderPath && window.api.getIndexedFolder) {
            const indexed = await window.api.getIndexedFolder(folderPath, currentPath)
            if (indexed && indexed.length > 0) {
              items = indexed
              isFromIndex = true
            }
          }

          if (items.length === 0) {
            const folderContents = await window.api.listFolderContents(currentPath)
            items = folderContents
            isFromIndex = false
          }

          const hasDirectVideos = items.some((item) => item.type === 'video')
          const folders = items.filter((item) => item.type === 'folder')

          if (folders.length > 0 && !hasDirectVideos) {
            let hasSubfolders = false

            if (isFromIndex) {
              for (const folder of folders) {
                if (folder.contents && folder.contents.some((item) => item.type === 'folder')) {
                  hasSubfolders = true
                  break
                }
              }
            }

            if (!hasSubfolders) {
              for (const folder of folders) {
                try {
                  let subItems: FolderItem[] = []

                  if (folderPath && window.api.getIndexedFolder) {
                    const indexed = await window.api.getIndexedFolder(folderPath, folder.path)
                    if (indexed && indexed.length > 0) {
                      subItems = indexed
                    }
                  }

                  if (subItems.length === 0) {
                    subItems = await window.api.listFolderContents(folder.path)
                  }

                  if (subItems.some((item) => item.type === 'folder')) {
                    hasSubfolders = true
                    break
                  }
                } catch (error) {
                  console.error('Error checking subfolder contents:', error)
                  continue
                }
              }
            }

            if (hasSubfolders) {
              setIsModule(true)
            } else {
              setIsModule(false)
            }
          } else {
            setIsModule(false)
          }
        } catch (error) {
          console.error('Error determining page type:', error)
          setIsModule(false)
        }
      })
    }

    determinePageType()
  }, [currentPath, folderPath, startTransition])

  if (isPending || isModule === null) {
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

  return isModule ? <CourseModule /> : <CourseSubmodule />
}

export default CourseContentRouter
