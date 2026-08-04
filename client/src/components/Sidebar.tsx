import { useMemo, useState } from 'react'
import { api, type DialogItem } from '../lib/api'
import { LazyImage } from './LazyImage'

type SidebarProps = {
  dialogs: DialogItem[]
  selectedGroupId?: string
  loading?: boolean
  onSelect: (groupId: string) => void
}

export function Sidebar({
  dialogs,
  selectedGroupId,
  loading,
  onSelect
}: SidebarProps) {
  const [query, setQuery] = useState('')

  const filteredDialogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return dialogs

    return dialogs.filter((dialog) =>
      dialog.title.toLowerCase().includes(normalizedQuery)
    )
  }, [dialogs, query])

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-4">
        <h2 className="text-lg font-semibold">Courses</h2>
        <input
          className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-violet-500 focus:ring-2"
          placeholder="Search groups..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <p className="px-3 py-2 text-sm text-slate-500">Loading courses...</p>
        )}

        {!loading && filteredDialogs.length === 0 && (
          <p className="px-3 py-2 text-sm text-slate-500">No groups found.</p>
        )}

        <ul className="space-y-1">
          {filteredDialogs.map((dialog) => {
            const isSelected = dialog.id === selectedGroupId

            return (
              <li key={dialog.id}>
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'bg-violet-600/20 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  onClick={() => onSelect(dialog.id)}
                  type="button"
                >
                  {dialog.hasPhoto ? (
                    <LazyImage
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                      src={api.dialogs.photoUrl(dialog.id)}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs uppercase text-slate-400">
                      {dialog.title.slice(0, 1)}
                    </div>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{dialog.title}</span>
                    <span className="block text-xs capitalize text-slate-500">
                      {dialog.type}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
