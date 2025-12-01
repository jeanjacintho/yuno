import type { FolderItem } from '../../../shared/types'
import type { FolderStructureInfo } from '../../../shared/types/folder-structure'
import type { User } from '@prisma/client'
import type { SystemUsernameResult, CreateUserResult, DatabaseResult } from '../../../shared/types'

declare global {
  interface Window {
    api?: {
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
    }
  }
}
