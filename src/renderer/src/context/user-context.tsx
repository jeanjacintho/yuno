import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useTransition
} from 'react'

interface UserContextUser {
  id: number
  name: string
  email: string
  isActive: boolean
  lastLoginAt?: Date
}

interface UserContextType {
  user: UserContextUser | null
  isPending: boolean
  setUser: (user: UserContextUser | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [user, setUser] = useState<UserContextUser | null>(null)
  const [isPending, startTransition] = useTransition()

  // Carregar dados do usuário do sistema ao inicializar
  useEffect(() => {
    const loadUserData = async (): Promise<void> => {
      try {
        if (!window.api) {
          return
        }

        const usernameResult = await window.api.getSystemUsername()
        if (usernameResult.success && usernameResult.username) {
          const createResult = await window.api.createSystemUser(usernameResult.username)
          if (createResult.success && createResult.user) {
            const user = createResult.user
            startTransition(() => {
              setUser({
                id: user.id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                lastLoginAt: user.lastLoginAt
                  ? new Date(user.lastLoginAt)
                  : undefined
              })
            })
            try {
              localStorage.setItem('currentUserId', String(user.id))
            } catch {}
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
