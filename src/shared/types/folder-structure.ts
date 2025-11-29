export interface FolderStructureInfo {
  maxDepth: number
  videoDepth: number
  totalFolders: number
  totalVideos: number
  structure: FolderLevelInfo[]
}

export interface FolderLevelInfo {
  level: number
  type: 'course' | 'module' | 'lesson'
  path: string
  name: string
  hasVideos: boolean
  hasSubfolders: boolean
  videoCount: number
  subfolderCount: number
}
