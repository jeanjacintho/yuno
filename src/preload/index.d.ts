import { ElectronAPI } from '@electron-toolkit/preload'
import type { User } from '@prisma/client'
import type {
  FolderItem,
  SystemUsernameResult,
  CreateUserResult,
  DatabaseResult
} from '../../shared/types'
import type { FolderStructureInfo } from '../../shared/types/folder-structure'

interface Api {
  selectFolder: () => Promise<string | null>
  listFolderContents: (folderPath: string) => Promise<FolderItem[]>
  testDatabaseConnection: () => Promise<boolean>
  getAllUsers: () => Promise<User[]>
  getSystemUsername: () => Promise<SystemUsernameResult>
  createSystemUser: (username: string) => Promise<CreateUserResult>
  setUserCourseFolder: (userId: number, folderPath: string | null) => Promise<DatabaseResult>
  getUserCourseFolder: (userId: number) => Promise<string | null>
  checkFolderExists: (folderPath: string) => Promise<boolean>
  analyzeFolderStructure: (folderPath: string) => Promise<FolderStructureInfo | null>
  startCourseIndex: (rootPath: string) => Promise<{ jobId?: string; error?: string }>
  getCourseIndexStatus: (
    jobId: string
  ) => Promise<
    | {
        id: string
        rootPath: string
        status: 'pending' | 'running' | 'completed' | 'failed'
        totalFolders?: number
        totalVideos?: number
        error?: string
      }
    | null
  >
  getIndexedFolder: (rootPath: string, folderPath: string) => Promise<FolderItem[] | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
