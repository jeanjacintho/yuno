import { ipcMain, dialog } from 'electron'
import os from 'node:os'
import { promises as fs } from 'node:fs'
import { FileProcessor } from '../services/file-processor'
import { DatabaseService } from '../services/database-service'
import type { FolderItem } from '../../shared/types/index'

export function setupIpcHandlers(): void {
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle('check-folder-exists', async (_event, folderPath: string): Promise<boolean> => {
    try {
      if (!folderPath) {
        return false
      }
      const stats = await fs.stat(folderPath)
      return stats.isDirectory()
    } catch (error) {
      console.error('Error checking folder existence:', error)
      return false
    }
  })

  ipcMain.handle(
    'list-folder-contents',
    async (_event, folderPath: string): Promise<FolderItem[]> => {
      try {
        return await FileProcessor.getFolderContentsRecursively(folderPath)
      } catch (error) {
        console.error('Error listing folder contents:', error)
        return []
      }
    }
  )

  ipcMain.handle('test-database-connection', async () => {
    return await DatabaseService.testConnection()
  })

  ipcMain.handle('get-all-users', async () => {
    return await DatabaseService.getAllUsers()
  })

  ipcMain.handle('get-system-username', async () => {
    try {
      const username = os.userInfo().username
      return {
        success: true,
        username
      }
    } catch (error) {
      console.error('Error getting system username:', error)
      return {
        success: false,
        error: 'Failed to get system username'
      }
    }
  })

  ipcMain.handle('create-system-user', async (_event, username: string) => {
    return await DatabaseService.createSystemUser(username)
  })

  ipcMain.handle(
    'set-user-course-folder',
    async (_event, userId: number, folderPath: string | null) => {
      return await DatabaseService.setUserCourseFolder(userId, folderPath)
    }
  )

  ipcMain.handle('get-user-course-folder', async (_event, userId: number) => {
    return await DatabaseService.getUserCourseFolder(userId)
  })
}
