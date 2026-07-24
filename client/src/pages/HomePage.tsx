import { api, type AuthUser } from '../lib/api'

type HomePageProps = {
  user: AuthUser
  onLogout: () => void
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'Telegram user'

  async function handleLogout() {
    await api.auth.logout()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Yuno</h1>
          <p className="text-sm text-slate-400">Signed in as {displayName}</p>
        </div>
        <button
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          onClick={handleLogout}
          type="button"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">Telegram connected</h2>
        <p className="mt-3 text-slate-400">
          Your session is saved locally. Course listing and media streaming will
          be available in the next steps.
        </p>
      </main>
    </div>
  )
}
