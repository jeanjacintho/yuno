const API_BASE = '/api'

export type AuthUser = {
  id: string
  firstName?: string
  lastName?: string
  username?: string
}

export type AuthStatus = {
  authenticated: boolean
  user?: AuthUser
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed')
  }
  return data
}

export const api = {
  auth: {
    status: () => fetch(`${API_BASE}/auth/status`).then((res) => parseJson<AuthStatus>(res)),
    start: (phone: string) =>
      fetch(`${API_BASE}/auth/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      }).then((res) => parseJson<{ ok: boolean; isCodeViaApp: boolean }>(res)),
    verify: (payload: { phone: string; code?: string; password?: string }) =>
      fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then((res) =>
        parseJson<{
          ok: boolean
          authenticated?: boolean
          requiresPassword?: boolean
          user?: AuthUser
        }>(res)
      ),
    logout: () =>
      fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).then((res) =>
        parseJson<{ ok: boolean }>(res)
      )
  },
  dialogs: {
    list: () => fetch(`${API_BASE}/dialogs`),
    media: (id: string, offsetId?: number) =>
      fetch(`${API_BASE}/dialogs/${id}/media${offsetId ? `?offsetId=${offsetId}` : ''}`)
  },
  progress: {
    get: (chatId: string) => fetch(`${API_BASE}/progress/${chatId}`),
    set: (payload: unknown) =>
      fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
  },
  streamUrl: (chatId: string, messageId: string) =>
    `${API_BASE}/stream/${chatId}/${messageId}`,
  thumbnailUrl: (chatId: string, messageId: string) =>
    `${API_BASE}/thumbnail/${chatId}/${messageId}`
}
