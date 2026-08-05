import { useEffect, useState, type CSSProperties } from 'react'
import { api, type AuthUser, type DialogItem } from '../lib/api'
import { AppSidebar } from '@/components/app-sidebar'
import { MediaTable } from '@/components/media-table'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

type HomePageProps = {
  user: AuthUser
  onLogout: () => void
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [dialogs, setDialogs] = useState<DialogItem[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
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
        const [dialogsResponse, favoritesResponse] = await Promise.all([
          api.dialogs.list(),
          api.favorites.list()
        ])
        if (cancelled) return

        setDialogs(dialogsResponse.items)
        setFavoriteIds(favoritesResponse.items)
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

  async function handleToggleFavorite(groupId: string, favorite: boolean) {
    const previous = favoriteIds

    setFavoriteIds((current) =>
      favorite ? [...current.filter((id) => id !== groupId), groupId] : current.filter((id) => id !== groupId)
    )

    try {
      const response = await api.favorites.set({ dialogId: groupId, favorite })
      setFavoriteIds(response.items)
    } catch (err) {
      setFavoriteIds(previous)
      setError(err instanceof Error ? err.message : 'Failed to update favorite')
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)'
        } as CSSProperties
      }
    >
      <AppSidebar
        dialogs={dialogs}
        favoriteIds={favoriteIds}
        loading={loadingDialogs}
        selectedGroupId={selectedGroupId}
        onSelectCourse={setSelectedGroupId}
        onToggleFavorite={handleToggleFavorite}
        user={{
          name: displayName,
          subtitle: user.username ? `@${user.username}` : 'Telegram account',
          avatar: user.hasPhoto ? api.auth.photoUrl() : undefined,
          fallback: avatarFallback
        }}
        onLogout={handleLogout}
      />

      <SidebarInset>
        <SiteHeader title={selectedDialog?.title ?? 'Select a course'} />

        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
          {error && (
            <p className="mx-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive lg:mx-6">
              {error}
            </p>
          )}

          {selectedGroupId ? (
            <div className="px-4 lg:px-6">
              <MediaTable groupId={selectedGroupId} />
            </div>
          ) : (
            !loadingDialogs && (
              <div className="flex flex-1 items-center justify-center px-4 text-muted-foreground lg:px-6">
                Select a course from the sidebar to view its lessons.
              </div>
            )
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
