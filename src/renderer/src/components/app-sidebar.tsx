import * as React from 'react'
import { BookOpen, Command, FileQuestion, Gem, LayoutDashboard, Presentation, Search, Send, Settings2 } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@renderer/components/ui/sidebar'
import { Input } from '@renderer/components/ui/input'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'
import { NavSecondary } from './nav-secondary'
import SettingsDialog from '../pages/settings/settings'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      isActive: true
    },
    {
      title: 'Courses',
      url: '/courses',
      icon: Presentation
    },
    {
      title: 'Theoretical Study',
      url: '/theoretical-study',
      icon: BookOpen
    },
    {
      title: 'Quiz',
      url: '/quiz',
      icon: FileQuestion
    }
  ],
  navSecondary: [
    {
      title: 'Go Pro',
      secondtitle: '$12/month',
      url: '#',
      icon: Gem,
      class: 'bg-primary/10 text-primary font-bold'
    },
    {
      title: 'Support',
      url: '#',
      icon: Send
    },
    {
      title: 'Settings',
      icon: Settings2
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const navSecondaryWithHandlers = data.navSecondary.map((item) => {
    if (item.title === 'Settings') {
      return {
        ...item,
        onClick: () => setSettingsOpen(true)
      }
    }
    return item
  })

  return (
    <>
      <Sidebar variant="floating" collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Yuno</span>
                    <span className="truncate text-xs">LMS platafform</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="px-2 pb-2">
            {isCollapsed ? (
              <SidebarMenuButton size="sm" className="w-full justify-center">
                <Search className="size-4" />
              </SidebarMenuButton>
            ) : (
              <Input type="search" placeholder="Search..." className="w-full" />
            )}
          </div>
          <NavMain items={data.navMain} />
          <NavSecondary items={navSecondaryWithHandlers} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
