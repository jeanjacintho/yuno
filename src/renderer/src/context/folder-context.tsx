import { createContext, ReactNode, useContext, useState } from 'react'

interface FolderContextType {
  folderPath: string | null
  setFolderPath: (path: string | null) => void
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

export const FolderProvider = ({ children }: { children: ReactNode }) => {
  const [folderPath, setFolderPath] = useState<string | null>(null)

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
