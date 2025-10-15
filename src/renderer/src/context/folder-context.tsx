import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface FolderContextType {
  folderPath: string | null
  setFolderPath: (path: string | null) => void
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

export const FolderProvider = ({ children }: { children: ReactNode }) => {
  const [folderPath, setFolderPath] = useState<string | null>(null)

  useEffect(() => {
    const loadFolder = async (): Promise<void> => {
      try {
        const userIdStr =
          typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
        const userId = userIdStr ? parseInt(userIdStr, 10) : null
        if (userId && (window as any).api?.getUserCourseFolder) {
          const saved = await (window as any).api.getUserCourseFolder(userId)
          if (saved) setFolderPath(saved)
        }
      } catch {}
    }
    loadFolder()
  }, [])

  return (
    <FolderContext.Provider value={{ folderPath, setFolderPath }}>
      {children}
    </FolderContext.Provider>
  )
}

export function useFolder() {
  const context = useContext(FolderContext)
  if (!context) {
    throw new Error('useFolder must be used within a FolderProvider')
  }
  return context
}
