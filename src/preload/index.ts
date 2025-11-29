import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  FolderItem,
  SystemUsernameResult,
  CreateUserResult,
  DatabaseResult
} from '../shared/types'
import type { User } from '@prisma/client'

const api = {
  selectFolder: async (): Promise<string | null> => {
    return await ipcRenderer.invoke('select-folder')
  },
  listFolderContents: async (folderPath: string): Promise<FolderItem[]> => {
    return await ipcRenderer.invoke('list-folder-contents', folderPath)
  },
  testDatabaseConnection: async (): Promise<boolean> => {
    return await ipcRenderer.invoke('test-database-connection')
  },
  getAllUsers: async (): Promise<User[]> => {
    return await ipcRenderer.invoke('get-all-users')
  },
  getSystemUsername: async (): Promise<SystemUsernameResult> => {
    return await ipcRenderer.invoke('get-system-username')
  },
  createSystemUser: async (username: string): Promise<CreateUserResult> => {
    return await ipcRenderer.invoke('create-system-user', username)
  },
  setUserCourseFolder: async (
    userId: number,
    folderPath: string | null
  ): Promise<DatabaseResult> => {
    return await ipcRenderer.invoke('set-user-course-folder', userId, folderPath)
  },
  getUserCourseFolder: async (userId: number): Promise<string | null> => {
    return await ipcRenderer.invoke('get-user-course-folder', userId)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
