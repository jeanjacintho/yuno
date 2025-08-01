import { Search } from 'lucide-react'

import { Label } from '@renderer/components/ui/label'
import { SidebarInput } from '@renderer/components/ui/sidebar'
import React from 'react'

export function SearchForm({ ...props }: React.ComponentProps<'form'>): React.JSX.Element {
  return (
    <form {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput id="search" placeholder="Type to search..." className="h-8 pl-7" />
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  )
}
