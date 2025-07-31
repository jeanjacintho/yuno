import { SidebarIcon } from 'lucide-react'
import { Button } from './ui/button'
import { useSidebar } from './ui/sidebar'
import { Separator } from './ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './ui/breadcrumb'
import { SearchForm } from './search-form'
import { NavUser } from './nav-user'

export function SiteHeader(): React.ReactElement {
  const { toggleSidebar } = useSidebar()
  const data = {
    user: {
      name: 'shadcn',
      email: 'm@example.com',
      avatar: '/avatars/shadcn.jpg'
    }
  }
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center [--header-height:calc(--spacing(14))]">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon />
        </Button>
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
