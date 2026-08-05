import * as React from 'react'
import { GraduationCapIcon } from 'lucide-react'
import { type DialogItem } from '@/lib/api'
import { NavCourses } from '@/components/nav-courses'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  dialogs: DialogItem[]
  favoriteIds: string[]
  loading?: boolean
  selectedGroupId?: string
  onSelectCourse: (groupId: string) => void
  onToggleFavorite: (groupId: string, favorite: boolean) => void
  user: {
    name: string
    subtitle: string
    avatar?: string
    fallback: string
  }
  onLogout: () => void
}

export function AppSidebar({
  dialogs,
  favoriteIds,
  loading,
  selectedGroupId,
  onSelectCourse,
  onToggleFavorite,
  user,
  onLogout,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              size="lg"
            >
              <GraduationCapIcon className="size-5!" />
              <span className="text-base font-semibold">Yuno</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex min-h-0 flex-1 flex-col">
        <NavCourses
          dialogs={dialogs}
          favoriteIds={favoriteIds}
          loading={loading}
          selectedGroupId={selectedGroupId}
          onSelect={onSelectCourse}
          onToggleFavorite={onToggleFavorite}
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
