import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface FolderContextType {
  folderPath: string | null
  setFolderPath: (path: string | null) => Promise<void>
  isValidating: boolean
  isValid: boolean
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

interface FolderProviderProps {
  children: ReactNode
}

export const FolderProvider = ({ children }: FolderProviderProps) => {
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const loadAndValidateFolder = async (): Promise<void> => {
      try {
        setIsValidating(true)
        const userIdStr =
          typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
        const userId = userIdStr ? parseInt(userIdStr, 10) : null

        if (userId && window.api?.getUserCourseFolder) {
          const saved = await window.api.getUserCourseFolder(userId)

          if (saved) {
            if (window.api?.checkFolderExists) {
              const exists = await window.api.checkFolderExists(saved)

              if (exists) {
                setFolderPath(saved)
                setIsValid(true)
              } else {
                console.warn('Pasta salva não existe mais:', saved)
                setFolderPath(null)
                setIsValid(false)

                if (window.api?.setUserCourseFolder) {
                  await window.api.setUserCourseFolder(userId, null)
                }
              }
            } else {
              setFolderPath(saved)
              setIsValid(true)
            }
          } else {
            setFolderPath(null)
            setIsValid(false)
          }
        }
      } catch (error) {
        console.error('Error loading folder path:', error)
        setFolderPath(null)
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }
    loadAndValidateFolder()
  }, [])

  const setFolderPathWithValidation = async (path: string | null): Promise<void> => {
    setFolderPath(path)

    if (path && window.api?.checkFolderExists) {
      setIsValidating(true)
      try {
        const exists = await window.api.checkFolderExists(path)
        setIsValid(exists)

        if (!exists) {
          setFolderPath(null)
        }
      } catch (error) {
        console.error('Error validating folder:', error)
        setIsValid(false)
        setFolderPath(null)
      } finally {
        setIsValidating(false)
      }
    } else {
      setIsValid(path !== null)
    }
  }

  return (
    <FolderContext.Provider
      value={{
        folderPath,
        setFolderPath: setFolderPathWithValidation,
        isValidating,
        isValid
      }}
    >
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
