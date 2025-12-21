import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  FolderItem,
  SystemUsernameResult,
  CreateUserResult,
  DatabaseResult
} from '../shared/types'
import type { FolderStructureInfo } from '../shared/types/folder-structure'
import type { User } from '@prisma/client'

console.log('[Preload] Script carregado')
console.log('[Preload] contextIsolated:', process.contextIsolated)
console.log('[Preload] nodeIntegration:', process.versions.node)

const api = {
  selectFolder: async (): Promise<string | null> => {
    return await ipcRenderer.invoke('select-folder')
  },
  listFolderContents: async (
    folderPath: string,
    includeDuration?: boolean
  ): Promise<FolderItem[]> => {
    return await ipcRenderer.invoke('list-folder-contents', folderPath, includeDuration)
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
  },
  checkFolderExists: async (folderPath: string): Promise<boolean> => {
    return await ipcRenderer.invoke('check-folder-exists', folderPath)
  },
  analyzeFolderStructure: async (folderPath: string): Promise<FolderStructureInfo | null> => {
    return await ipcRenderer.invoke('analyze-folder-structure', folderPath)
  },
  startCourseIndex: async (rootPath: string): Promise<{ jobId?: string; error?: string }> => {
    return await ipcRenderer.invoke('start-course-index', rootPath)
  },
  getCourseIndexStatus: async (jobId: string) => {
    return await ipcRenderer.invoke('get-course-index-status', jobId)
  },
  getIndexedFolder: async (rootPath: string, folderPath: string): Promise<FolderItem[] | null> => {
    return await ipcRenderer.invoke('get-indexed-folder', rootPath, folderPath)
  }
}

try {
  if (typeof contextBridge !== 'undefined') {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    console.log('[Preload] API exposta via contextBridge com sucesso')
  } else {
    throw new Error('contextBridge não está disponível')
  }
} catch (error) {
  console.error('[Preload] Erro ao expor via contextBridge, tentando método alternativo:', error)

  try {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Fallback quando contextBridge não está disponível
      window.electron = electronAPI
      // @ts-ignore - Fallback quando contextBridge não está disponível
      window.api = api
      console.log('[Preload] API exposta diretamente no window (fallback)')
    }
  } catch (fallbackError) {
    console.error('[Preload] Erro crítico ao expor API:', fallbackError)
  }
}
