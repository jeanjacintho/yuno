import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from './ui/sidebar'
import { SiteHeader } from './site-header'
import { AppSidebar } from './app-sidebar'

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
