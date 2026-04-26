import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@renderer/components/ui/sidebar'
import React from 'react'

export function NavMain({
  items
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    iconClassName?: string
    items?: {
      title: string
      url: string
    }[]
  }[]
}): React.JSX.Element {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
        Sua trilha
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-xl',
                      item.iconClassName ?? 'bg-primary/15 text-primary'
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <span className="font-bold">{item.title}</span>
                </a>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
