import type { FolderItem } from '../../../shared/types'

declare global {
  interface Window {
    api?: {
      selectFolder: () => Promise<string | null>
      listFolderContents: (folderPath: string) => Promise<FolderItem[]>
      testDatabaseConnection: () => Promise<boolean>
      getAllUsers: () => Promise<any[]>
      getSystemUsername: () => Promise<{ success: boolean; username?: string; error?: string }>
      createSystemUser: (username: string) => Promise<{
        success: boolean
        message?: string
        user?: any
      }>
      setUserCourseFolder: (
        userId: number,
        folderPath: string | null
      ) => Promise<{ success: boolean }>
      getUserCourseFolder: (userId: number) => Promise<string | null>
      checkFolderExists: (folderPath: string) => Promise<boolean>
    }
  }
}
