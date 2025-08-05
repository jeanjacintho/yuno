import { AppSidebar } from '@renderer/components/app-sidebar'
import { SiteHeader } from '@renderer/components/site-header'
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'

const AppLayout = (): React.ReactElement => {
  const location = useLocation()
  const isCoursesPage = location.pathname === '/courses'
  const defaultOpen = !isCoursesPage

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
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
