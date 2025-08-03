import * as React from 'react'
import { type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@renderer/components/ui/sidebar'

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    secondtitle?: string
    url?: string
    icon: LucideIcon
    class?: string
    onClick?: () => void
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>): React.JSX.Element {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={!!item.url}
                size="sm"
                onClick={item.onClick}
                className={item.class}
              >
                {item.url ? (
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                    <span className="ml-auto">{item.secondtitle}</span>
                  </a>
                ) : (
                  <a className="flex gap-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    <span className="ml-auto">{item.secondtitle}</span>
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
