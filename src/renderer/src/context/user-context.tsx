import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useTransition
} from 'react'

interface User {
  id: number
  name: string
  email: string
  isActive: boolean
  lastLoginAt?: Date
}

interface UserContextType {
  user: User | null
  isPending: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [isPending, startTransition] = useTransition()

  // Carregar dados do usuário do sistema ao inicializar
  useEffect(() => {
    const loadUserData = async (): Promise<void> => {
      try {
        // Capturar nome do usuário do sistema
        const usernameResult = await window.api.getSystemUsername()
        if (usernameResult.success && usernameResult.username) {
          // Criar ou buscar usuário no banco
          const createResult = await window.api.createSystemUser(usernameResult.username)
          if (createResult.success && createResult.user) {
            startTransition(() => {
              setUser({
                id: createResult.user.id,
                name: createResult.user.name,
                email: createResult.user.email,
                isActive: createResult.user.isActive,
                lastLoginAt: createResult.user.lastLoginAt
                  ? new Date(createResult.user.lastLoginAt)
                  : undefined
              })
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }

    loadUserData()
  }, [])

  const logout = (): void => {
    setUser(null)
  }

  const value: UserContextType = {
    user,
    isPending,
    setUser,
    logout
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
