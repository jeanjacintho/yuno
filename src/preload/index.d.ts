import { ElectronAPI } from '@electron-toolkit/preload'
import { User } from '@prisma/client'

interface Api {
  selectFolder: () => Promise<string>
  listFolderContents: (folderPath: string) => Promise<any[]>

  // Database operations
  testDatabaseConnection: () => Promise<boolean>
  getAllUsers: () => Promise<User[]>
  getSystemUsername: () => Promise<{ success: boolean; username?: string; error?: string }>
  createSystemUser: (
    username: string
  ) => Promise<{ success: boolean; message?: string; user?: any }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
