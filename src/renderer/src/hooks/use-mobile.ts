import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const handleResize = (event: MediaQueryListEvent | MediaQueryList): void => {
      setIsMobile(event.matches)
    }

    // Set the initial state
    handleResize(mql)

    // Add listener for changes
    mql.addEventListener('change', handleResize)

    // Cleanup listener on unmount
    return () => {
      mql.removeEventListener('change', handleResize)
    }
  }, [])

  return isMobile
}
