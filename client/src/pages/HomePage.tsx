import { useEffect, useState } from 'react'
import { api, type AuthUser, type DialogItem } from '../lib/api'
import { ModeToggle } from '../components/mode-toggle'
import { MediaGrid } from '../components/MediaGrid'
import { Sidebar } from '../components/Sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

type HomePageProps = {
  user: AuthUser
  onLogout: () => void
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [dialogs, setDialogs] = useState<DialogItem[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const [loadingDialogs, setLoadingDialogs] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'Telegram user'

  const avatarFallback =
    [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('') ||
    user.username?.slice(0, 2).toUpperCase() ||
    'U'

  const selectedDialog = dialogs.find((dialog) => dialog.id === selectedGroupId)

  useEffect(() => {
    let cancelled = false

    async function loadDialogs() {
      setLoadingDialogs(true)
      setError(null)

      try {
        const response = await api.dialogs.list()
        if (cancelled) return

        setDialogs(response.items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load groups')
        }
      } finally {
        if (!cancelled) {
          setLoadingDialogs(false)
        }
      }
    }

    loadDialogs()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogout() {
    await api.auth.logout()
    onLogout()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Yuno</h1>
          <p className="text-sm text-muted-foreground">Signed in as {displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Avatar title={displayName}>
            {user.hasPhoto && (
              <AvatarImage alt={displayName} src={api.auth.photoUrl()} />
            )}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <Button variant="outline" onClick={handleLogout} type="button">
            Log out
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          dialogs={dialogs}
          loading={loadingDialogs}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {selectedGroupId && selectedDialog ? (
            <MediaGrid groupId={selectedGroupId} groupTitle={selectedDialog.title} />
          ) : (
            !loadingDialogs && (
              <div className="flex h-full items-center justify-center text-slate-500">
                Select a group to view its media.
              </div>
            )
          )}
        </main>
      </div>
    </div>
  )
}
