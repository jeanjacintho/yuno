import { AppSidebar } from '@renderer/components/app-sidebar'
import { SiteHeader } from '@renderer/components/site-header'
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import React from 'react'
import { Outlet } from 'react-router-dom'

const AppLayout = (): React.ReactElement => {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '19rem'
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppLayout
