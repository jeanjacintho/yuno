import { ipcMain, dialog } from 'electron'
import os from 'node:os'
import { promises as fs } from 'node:fs'
import { FileProcessor } from '../services/file-processor'
import { DatabaseService } from '../services/database-service'
import { CourseIndexService } from '../services/course-index-service'
import type { FolderItem } from '../../shared/types'

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
    async (_event, folderPath: string, includeDuration = false): Promise<FolderItem[]> => {
      try {
        const items = await FileProcessor.getFolderContents(folderPath)
        if (includeDuration) {
          return await FileProcessor.enrichVideosWithDuration(items)
        }
        return items
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

  ipcMain.handle('analyze-folder-structure', async (_event, folderPath: string) => {
    try {
      const folderItems = await FileProcessor.getFolderContentsRecursively(folderPath)
      const { FolderStructureAnalyzer } = await import('../services/folder-structure-analyzer')
      return FolderStructureAnalyzer.analyzeStructureFromItems(folderItems, folderPath)
    } catch (error) {
      console.error('Error analyzing folder structure:', error)
      return null
    }
  })

  ipcMain.handle('start-course-index', async (_event, rootPath: string) => {
    try {
      const jobId = CourseIndexService.startIndex(rootPath)
      return { jobId }
    } catch (error) {
      console.error('Error starting course index:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('get-course-index-status', async (_event, jobId: string) => {
    try {
      return CourseIndexService.getStatus(jobId)
    } catch (error) {
      console.error('Error getting course index status:', error)
      return null
    }
  })

  ipcMain.handle(
    'get-indexed-folder',
    async (_event, rootPath: string, folderPath: string): Promise<FolderItem[] | null> => {
      try {
        // Tenta primeiro usar a estrutura estruturada do banco
        // Verifica se é um módulo (submodule)
        const submoduleItems = await DatabaseService.getSubmoduleByPath(folderPath)
        if (submoduleItems) {
          return submoduleItems
        }

        // Verifica se é um módulo
        const moduleItems = await DatabaseService.getModuleByPath(folderPath)
        if (moduleItems) {
          return moduleItems
        }

        // Verifica se é um curso
        const courseItems = await DatabaseService.getCourseByPath(folderPath)
        if (courseItems) {
          return courseItems
        }

        // Fallback para o método antigo (JSON)
        const index = await DatabaseService.getCourseIndex(rootPath)
        if (!index) {
          return null
        }

        const findFolder = (items: FolderItem[], targetPath: string): FolderItem | null => {
          for (const item of items) {
            if (item.path === targetPath && item.type === 'folder') {
              return item
            }
            if (item.type === 'folder' && item.contents) {
              const found = findFolder(item.contents, targetPath)
              if (found) {
                return found
              }
            }
          }
          return null
        }

        const folder = findFolder(index, folderPath)
        if (!folder) {
          return null
        }

        return folder.contents ?? []
      } catch (error) {
        console.error('Error getting indexed folder:', error)
        return null
      }
    }
  )

  ipcMain.handle(
    'get-videos-by-folder-path',
    async (_event, folderPath: string): Promise<FolderItem[] | null> => {
      try {
        return await DatabaseService.getVideosByFolderPath(folderPath)
      } catch (error) {
        console.error('Error getting videos by folder path:', error)
        return null
      }
    }
  )

  ipcMain.handle(
    'save-course-structure',
    async (
      _event,
      rootPath: string,
      items: FolderItem[]
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        return await DatabaseService.saveCourseStructure(rootPath, items)
      } catch (error) {
        console.error('Error saving course structure:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )
}
