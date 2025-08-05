declare global {
  interface Window {
    api?: {
      selectFolder: () => Promise<string | null>
      listFolderContents: (folderPath: string) => Promise<FolderItem[]>
    }
  }
}

interface FolderItem {
  name: string
  path: string
  type: 'folder' | 'video'
}
