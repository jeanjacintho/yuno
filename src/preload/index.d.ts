import { ElectronAPI } from '@electron-toolkit/preload'
import type { User } from '@prisma/client'
import type {
  FolderItem,
  SystemUsernameResult,
  CreateUserResult,
  DatabaseResult
} from '../../shared/types'

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
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
