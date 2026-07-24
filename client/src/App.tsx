import { useEffect, useState } from 'react'
import { api, type AuthUser } from './lib/api'
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <LoginPage onAuthenticated={setUser} />
  }

  return <HomePage user={user} onLogout={() => setUser(null)} />
}
