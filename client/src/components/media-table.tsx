import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  LoaderIcon,
  PlayIcon
} from 'lucide-react'
import { api, type MediaItem } from '@/lib/api'
import { LazyImage } from '@/components/LazyImage'
import { MediaPlayer } from '@/components/MediaPlayer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type MediaTableProps = {
  groupId: string
}

type MediaRow = MediaItem & {
  watched: boolean
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '—'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function MediaTable({ groupId }: MediaTableProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [nextOffsetId, setNextOffsetId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [watchedMap, setWatchedMap] = useState<Record<string, boolean>>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError(null)
      setItems([])
      setNextOffsetId(null)
      setSelectedItem(null)
      setGlobalFilter('')

      try {
        const [mediaResponse, progressResponse] = await Promise.all([
          api.dialogs.media(groupId),
          api.progress.get(groupId)
        ])

        if (cancelled) return

        setItems(mediaResponse.items)
        setNextOffsetId(mediaResponse.nextOffsetId)
        setWatchedMap(progressResponse.items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load media')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitial()

    return () => {
      cancelled = true
    }
  }, [groupId])

  const data = useMemo<MediaRow[]>(
    () =>
      items.map((item) => ({
        ...item,
        watched: Boolean(watchedMap[item.messageId])
      })),
    [items, watchedMap]
  )

  const columns = useMemo<ColumnDef<MediaRow>[]>(
    () => [
      {
        id: 'preview',
        header: () => null,
        cell: ({ row }) => (
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted">
            {row.original.hasThumbnail ? (
              <LazyImage
                alt=""
                className="size-full object-cover"
                src={api.thumbnailUrl(groupId, row.original.messageId)}
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span className="text-[10px] uppercase text-muted-foreground">
                {row.original.type.slice(0, 3)}
              </span>
            )}
          </div>
        ),
        enableSorting: false
      },
      {
        accessorKey: 'fileName',
        header: 'Lesson',
        cell: ({ row }) => (
          <button
            className="max-w-md truncate text-left font-medium hover:underline"
            onClick={() => setSelectedItem(row.original)}
            type="button"
          >
            {row.original.fileName}
          </button>
        )
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="px-1.5 capitalize text-muted-foreground">
            {row.original.type}
          </Badge>
        )
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.date)}</span>
        )
      },
      {
        accessorKey: 'size',
        header: () => <div className="text-right">Size</div>,
        cell: ({ row }) => (
          <div className="text-right text-muted-foreground">
            {formatFileSize(row.original.size)}
          </div>
        )
      },
      {
        accessorKey: 'watched',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            {row.original.watched ? (
              <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
            ) : (
              <LoaderIcon />
            )}
            {row.original.watched ? 'Watched' : 'Pending'}
          </Badge>
        )
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedItem(row.original)}
              type="button"
            >
              <PlayIcon data-icon="inline-start" />
              Open
            </Button>
          </div>
        ),
        enableSorting: false
      }
    ],
    [groupId]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).toLowerCase()
      if (!query) return true

      return (
        row.original.fileName.toLowerCase().includes(query) ||
        row.original.type.toLowerCase().includes(query)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  async function loadMore() {
    if (!nextOffsetId || loadingMore) return

    setLoadingMore(true)
    setError(null)

    try {
      const response = await api.dialogs.media(groupId, nextOffsetId)
      setItems((current) => [...current, ...response.items])
      setNextOffsetId(response.nextOffsetId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more media')
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleWatchedChange(messageId: string, watched: boolean) {
    setWatchedMap((current) => ({ ...current, [messageId]: watched }))

    try {
      await api.progress.set({ chatId: groupId, messageId, watched })
    } catch (err) {
      setWatchedMap((current) => ({ ...current, [messageId]: !watched }))
      setError(err instanceof Error ? err.message : 'Failed to update progress')
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-0">
        <div>
          <p className="text-sm text-muted-foreground">
            {items.length} lesson{items.length === 1 ? '' : 's'} loaded
          </p>
        </div>
        <Input
          className="max-w-sm"
          placeholder="Filter lessons..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading lessons...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No lessons found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-0">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} lesson
          {table.getFilteredRowModel().rows.length === 1 ? '' : 's'} shown
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
              items={[10, 20, 30, 50].map((pageSize) => ({
                label: `${pageSize}`,
                value: `${pageSize}`
              }))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              type="button"
            >
              <ChevronsLeftIcon />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              type="button"
            >
              <ChevronLeftIcon />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              type="button"
            >
              <ChevronRightIcon />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              type="button"
            >
              <ChevronsRightIcon />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      </div>

      {nextOffsetId && (
        <div className="flex justify-center px-4 lg:px-0">
          <Button disabled={loadingMore} onClick={loadMore} type="button" variant="outline">
            {loadingMore ? 'Loading...' : 'Load more from Telegram'}
          </Button>
        </div>
      )}

      <MediaPlayer
        chatId={groupId}
        item={selectedItem}
        watched={selectedItem ? Boolean(watchedMap[selectedItem.messageId]) : false}
        onClose={() => setSelectedItem(null)}
        onWatchedChange={handleWatchedChange}
      />
    </div>
  )
}
