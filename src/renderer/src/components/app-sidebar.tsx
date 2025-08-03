import * as React from 'react'
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  Gem,
  LifeBuoy,
  Map,
  PieChart,
  Presentation,
  Send,
  Settings2
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider
} from '@renderer/components/ui/sidebar'
import { NavMain } from './nav-main'
import { NavTertiary } from './nav-tertiary'
import { NavUser } from './nav-user'
import { NavSecondary } from './nav-secondary'
import SettingsDialog from '../pages/settings/settings'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg'
  },
  navMain: [
    {
      title: 'Courses',
      url: '/courses',
      icon: Presentation,
      isActive: true
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

  const navSecondaryWithHandlers = data.navSecondary.map(item => {
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
      <Sidebar variant="floating" {...props}>
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
          <NavMain items={data.navMain} />
          <NavSecondary items={navSecondaryWithHandlers} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
