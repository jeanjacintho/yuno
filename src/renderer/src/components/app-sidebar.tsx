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
      isActive: true,
      iconClassName: 'bg-sky-200/90 text-sky-900'
    },
    {
      title: 'Courses',
      url: '/courses',
      icon: Presentation,
      iconClassName: 'bg-lime-200/90 text-lime-900'
    },
    {
      title: 'Theoretical Study',
      url: '/theoretical-study',
      icon: BookOpen,
      iconClassName: 'bg-violet-200/90 text-violet-900'
    },
    {
      title: 'Quiz',
      url: '/quiz',
      icon: FileQuestion,
      iconClassName: 'bg-amber-200/90 text-amber-900'
    }
  ],
  navSecondary: [
    {
      title: 'Go Pro',
      secondtitle: '$12/month',
      url: '#',
      icon: Gem,
      class: '!font-extrabold !border-2 !border-lime-300/70 !bg-lime-100 !text-lime-900 !rounded-2xl'
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
                  <div className="from-primary to-lime-500 text-primary-foreground flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-2 ring-lime-300/60">
                    <Command className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-extrabold tracking-tight">Yuno</span>
                    <span className="text-muted-foreground truncate text-xs font-semibold">
                      Aprenda jogando
                    </span>
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
