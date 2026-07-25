import { useEffect, useState } from 'react'
import { api, type AuthUser } from './lib/api'
import { ModeToggle } from './components/mode-toggle'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    api.auth
      .status()
      .then((status) => {
        if (status.authenticated && status.user) {
          setUser(status.user)
        }
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <ModeToggle />
        </div>
        <LoginPage onAuthenticated={setUser} />
      </div>
    )
  }

  return <HomePage user={user} onLogout={() => setUser(null)} />
}
