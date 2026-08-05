import { useMemo, useState } from 'react'
import { StarIcon } from 'lucide-react'
import { api, type DialogItem } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type NavCoursesProps = {
  dialogs: DialogItem[]
  favoriteIds: string[]
  loading?: boolean
  selectedGroupId?: string
  onSelect: (groupId: string) => void
  onToggleFavorite: (groupId: string, favorite: boolean) => void
}

function sortDialogs(dialogs: DialogItem[]): DialogItem[] {
  return [...dialogs].sort((a, b) => a.title.localeCompare(b.title))
}

type CourseListProps = {
  dialogs: DialogItem[]
  favoriteIds: Set<string>
  selectedGroupId?: string
  onSelect: (groupId: string) => void
  onToggleFavorite: (groupId: string, favorite: boolean) => void
}

function CourseList({
  dialogs,
  favoriteIds,
  selectedGroupId,
  onSelect,
  onToggleFavorite
}: CourseListProps) {
  if (dialogs.length === 0) {
    return null
  }

  return (
    <>
      {dialogs.map((dialog) => {
        const isFavorite = favoriteIds.has(dialog.id)

        return (
          <SidebarMenuItem key={dialog.id}>
            <SidebarMenuButton
              className="gap-3 py-2"
              isActive={dialog.id === selectedGroupId}
              onClick={() => onSelect(dialog.id)}
              tooltip={dialog.title}
            >
              <Avatar>
                {dialog.hasPhoto && (
                  <AvatarImage alt={dialog.title} src={api.dialogs.photoUrl(dialog.id)} />
                )}
                <AvatarFallback className="text-xs font-medium uppercase">
                  {dialog.title.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{dialog.title}</span>
                <span className="block truncate text-xs capitalize text-muted-foreground">
                  {dialog.type}
                </span>
              </span>
            </SidebarMenuButton>
            <SidebarMenuAction
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'aria-expanded:bg-muted',
                isFavorite && 'opacity-100 md:opacity-100'
              )}
              onClick={(event) => {
                event.stopPropagation()
                onToggleFavorite(dialog.id, !isFavorite)
              }}
              showOnHover={!isFavorite}
            >
              <StarIcon
                className={cn(isFavorite && 'fill-amber-400 text-amber-400')}
              />
            </SidebarMenuAction>
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

export function NavCourses({
  dialogs,
  favoriteIds,
  loading,
  selectedGroupId,
  onSelect,
  onToggleFavorite
}: NavCoursesProps) {
  const [query, setQuery] = useState('')
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const { favoriteDialogs, allDialogs } = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = normalizedQuery
      ? dialogs.filter((dialog) => dialog.title.toLowerCase().includes(normalizedQuery))
      : dialogs

    const favorites = sortDialogs(filtered.filter((dialog) => favoriteIdSet.has(dialog.id)))
    const all = sortDialogs(filtered)

    return { favoriteDialogs: favorites, allDialogs: all }
  }, [dialogs, favoriteIdSet, query])

  const hasResults = allDialogs.length > 0

  return (
    <SidebarGroup className="min-h-0 flex-1">
      <SidebarGroupLabel>Courses</SidebarGroupLabel>
      <SidebarGroupContent className="flex min-h-0 flex-1 flex-col gap-2">
        <Input
          placeholder="Search courses..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <SidebarMenu className="min-h-0 flex-1 gap-3 overflow-y-auto">
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <div className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              </SidebarMenuItem>
            ))}

          {!loading && !hasResults && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No courses found.</p>
          )}

          {!loading && favoriteDialogs.length > 0 && (
            <>
              <SidebarGroupLabel className="px-2">Favorites</SidebarGroupLabel>
              <CourseList
                dialogs={favoriteDialogs}
                favoriteIds={favoriteIdSet}
                selectedGroupId={selectedGroupId}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
              />
            </>
          )}

          {!loading && allDialogs.length > 0 && (
            <>
              <SidebarGroupLabel className="px-2">All courses</SidebarGroupLabel>
              <CourseList
                dialogs={allDialogs}
                favoriteIds={favoriteIdSet}
                selectedGroupId={selectedGroupId}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
              />
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
