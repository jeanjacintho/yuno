import React, { useEffect, useState } from 'react'
import { SidebarIcon, Flame, Gem, Star } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useSidebar } from './ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './ui/breadcrumb'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useFolder } from '@renderer/context/folder-context'

export function SiteHeader(): React.ReactElement {
  const { toggleSidebar } = useSidebar()
  const location = useLocation()
  const params = useParams<{ coursePath?: string; videoPath?: string }>()
  const navigate = useNavigate()
  const { folderPath } = useFolder()
  const [breadcrumbItems, setBreadcrumbItems] = useState<Array<{ label: string; path?: string }>>(
    []
  )
  const [streakCount] = useState<number>(0)
  const experiencePoints = 0
  const gemCount = 0

  useEffect(() => {
    const items: Array<{ label: string; path?: string }> = []

    if (location.pathname.startsWith('/courses')) {
      items.push({ label: 'Cursos', path: '/courses' })

      if (params.coursePath) {
        try {
          const coursePath = decodeURIComponent(params.coursePath)

          // Constrói o breadcrumb com todas as pastas intermediárias
          if (folderPath && coursePath.startsWith(folderPath)) {
            const relativePath = coursePath.slice(folderPath.length)
            const pathSegments = relativePath.split('/').filter(Boolean)

            // Constrói os paths acumulados para cada segmento
            let currentPath = folderPath
            for (let i = 0; i < pathSegments.length; i++) {
              currentPath = `${currentPath}/${pathSegments[i]}`
              const segmentName = pathSegments[i]
              const encodedPath = encodeURIComponent(currentPath)

              // Se for o último segmento e não houver videoPath, não adiciona path (é a página atual)
              if (i === pathSegments.length - 1 && !params.videoPath) {
                items.push({ label: segmentName })
              } else {
                items.push({ label: segmentName, path: `/courses/${encodedPath}` })
              }
            }
          } else {
            // Se não estiver dentro da pasta raiz, apenas mostra o nome
            const folderName = coursePath.split('/').pop() || 'Curso'
            items.push({ label: folderName, path: `/courses/${params.coursePath}` })
          }

          if (params.videoPath) {
            const videoPath = decodeURIComponent(params.videoPath)
            const videoName = videoPath.split('/').pop() || 'Vídeo'
            items.push({ label: videoName })
          }
        } catch (error) {
          console.error('Error building breadcrumb:', error)
          // Fallback: apenas mostra o path atual
          items.push({ label: 'Curso' })
        }
      }
    } else if (location.pathname === '/dashboard') {
      items.push({ label: 'Dashboard' })
    }

    setBreadcrumbItems(items)
  }, [location.pathname, params, folderPath])

  const handleBreadcrumbClick = (path?: string): void => {
    if (path) {
      navigate(path)
    }
  }

  return (
    <header className="bg-card/95 border-border/80 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-50 flex w-full items-center border-b-2 backdrop-blur-md [--header-height:3.5rem]">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-3 sm:px-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Abrir menu">
          <SidebarIcon />
        </Button>
        <Breadcrumb className="hidden min-w-0 flex-1 sm:block">
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1

              return (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={item.path || '#'}
                        onClick={(e) => {
                          e.preventDefault()
                          if (item.path) {
                            handleBreadcrumbClick(item.path)
                          }
                        }}
                      >
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          <Badge
            variant="secondary"
            className="yuno-stat-amber h-8 gap-1 border-0 px-2.5 text-[0.7rem] font-extrabold text-amber-800 shadow-none"
          >
            <Star className="size-3.5" aria-hidden />
            <span>{experiencePoints} XP</span>
          </Badge>
          <Badge
            variant="secondary"
            className="h-8 gap-1 border-0 bg-gradient-to-b from-rose-200 to-rose-100 px-2.5 text-[0.7rem] font-extrabold text-rose-800 shadow-none"
          >
            <Gem className="size-3.5" aria-hidden />
            <span>{gemCount}</span>
          </Badge>
          <Badge
            variant="secondary"
            className="h-8 gap-1 border-0 bg-gradient-to-b from-orange-200/90 to-amber-100 px-2.5 text-[0.7rem] font-extrabold text-orange-900 shadow-none"
          >
            <Flame className="size-3.5 text-orange-600" aria-hidden />
            <span>{streakCount}</span>
          </Badge>
        </div>
      </div>
    </header>
  )
}
