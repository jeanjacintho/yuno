import { GridPattern } from '@renderer/components/ui/grid-pattern'
import { Toaster } from '@renderer/components/ui/sonner'
import { cn } from '@renderer/lib/utils'
import React from 'react'
import { Outlet } from 'react-router-dom'

const RootLayout = (): React.ReactElement => {
  return (
    <>
      <GridPattern
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 10],
          [12, 15],
          [15, 10],
          [10, 15],
          [15, 10],
          [10, 15],
          [15, 10]
        ]}
        className={cn(
          '[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]',
          'h-[500px] absolute top-0 left-1/2 -translate-x-1/2 z-0 pointer-events-none skew-y-12 opacity-60'
        )}
      />
      <Outlet />
      <Toaster />
    </>
  )
}

export default RootLayout
