import { useMemo, useState } from 'react'
import { api, type DialogItem } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

type NavCoursesProps = {
  dialogs: DialogItem[]
  loading?: boolean
  selectedGroupId?: string
  onSelect: (groupId: string) => void
}

export function NavCourses({
  dialogs,
  loading,
  selectedGroupId,
  onSelect
}: NavCoursesProps) {
  const [query, setQuery] = useState('')

  const filteredDialogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return dialogs

    return dialogs.filter((dialog) =>
      dialog.title.toLowerCase().includes(normalizedQuery)
    )
  }, [dialogs, query])

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

          {!loading && filteredDialogs.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No courses found.</p>
          )}

          {!loading &&
            filteredDialogs.map((dialog) => (
              <SidebarMenuItem key={dialog.id}>
                <SidebarMenuButton
                  className="gap-3 py-2"
                  isActive={dialog.id === selectedGroupId}
                  onClick={() => onSelect(dialog.id)}
                  tooltip={dialog.title}
                >
                  <Avatar>
                    {dialog.hasPhoto && (
                      <AvatarImage
                        alt={dialog.title}
                        src={api.dialogs.photoUrl(dialog.id)}
                      />
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
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
