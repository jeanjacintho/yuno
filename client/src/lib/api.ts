const API_BASE = '/api'

export const api = {
  auth: {
    start: (phone: string) =>
      fetch(`${API_BASE}/auth/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      }),
    verify: (payload: { phone: string; code: string; password?: string }) =>
      fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
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
