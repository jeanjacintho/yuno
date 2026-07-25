const API_BASE = '/api'

export type AuthUser = {
  id: string
  firstName?: string
  lastName?: string
  username?: string
  hasPhoto: boolean
}

export type AuthStatus = {
  authenticated: boolean
  user?: AuthUser
}

export type DialogType = 'group' | 'channel' | 'supergroup'

export type DialogItem = {
  id: string
  title: string
  type: DialogType
  hasPhoto: boolean
}

export type MediaType = 'video' | 'pdf' | 'photo' | 'document'

export type MediaItem = {
  messageId: string
  fileName: string
  type: MediaType
  size: number
  date: number
  hasThumbnail: boolean
}

export type MediaListResponse = {
  items: MediaItem[]
  nextOffsetId: number | null
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
    photoUrl: () => `${API_BASE}/auth/photo`,
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
    list: () =>
      fetch(`${API_BASE}/dialogs`).then((res) =>
        parseJson<{ items: DialogItem[] }>(res)
      ),
    media: (id: string, offsetId?: number) =>
      fetch(
        `${API_BASE}/dialogs/${id}/media${offsetId ? `?offsetId=${offsetId}` : ''}`
      ).then((res) => parseJson<MediaListResponse>(res)),
    photoUrl: (id: string) => `${API_BASE}/dialogs/${id}/photo`
  },
  progress: {
    get: (chatId: string) =>
      fetch(`${API_BASE}/progress/${chatId}`).then((res) =>
        parseJson<{ items: Record<string, boolean> }>(res)
      ),
    set: (payload: { chatId: string; messageId: string; watched: boolean }) =>
      fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then((res) => parseJson<{ ok: boolean }>(res))
  },
  streamUrl: (chatId: string, messageId: string) =>
    `${API_BASE}/stream/${chatId}/${messageId}`,
  thumbnailUrl: (chatId: string, messageId: string) =>
    `${API_BASE}/thumbnail/${chatId}/${messageId}`
}
