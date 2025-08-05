import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { useFolder } from '@renderer/context/folder-context'
import { Folder, Play } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface FolderItem {
  name: string
  path: string
  type: 'folder' | 'video'
}

interface API {
  listFolderContents: (folderPath: string) => Promise<FolderItem[]>
  selectFolder: () => Promise<string | null>
}

const Courses: React.FC = () => {
  const { folderPath } = useFolder()
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadSavedPath = async (): Promise<void> => {
      if (!folderPath) return

      setLoading(true)
      try {
        const api = (window as { api: API }).api
        if (api) {
          const items = await api.listFolderContents(folderPath)
          console.log(items)
          setFolderItems(items || [])
        }
      } catch (error) {
        console.error('Error loading folder contents:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSavedPath()
  }, [folderPath])

  const getIcon = (type: 'folder' | 'video'): React.JSX.Element => {
    return type === 'folder' ? <Folder className="w-4 h-4" /> : <Play className="w-4 h-4" />
  }

  return (
    <div className="p-4 w-full">
      <div className="space-y-4 w-full">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Folder: {folderPath}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden shadow-sm w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="py-2 px-6"></TableHead>
                    <TableHead className="py-2">Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {folderItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2 py-2 px-6">
                          {getIcon(item.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium py-2">{item.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!loading && folderItems.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            <p>No items found in this folder.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses
