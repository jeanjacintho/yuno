import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileTypeFromFile } from 'file-type'
import getVideoDuration from 'get-video-duration'
import { DatabaseOperations } from './database-operations'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName())
}

// Set DATABASE_URL based on environment
const dbPath = is.dev
  ? path.join(__dirname, '../../prisma/dev.db')
  : path.join(app.getPath('userData'), 'prod.db')

process.env.DATABASE_URL = `file:${dbPath}`
console.log('Database URL:', process.env.DATABASE_URL)
console.log('Database exists:', require('fs').existsSync(dbPath))

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Handle selected folder
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
})

interface FolderItem {
  name: string
  path: string
  type: 'folder' | 'video'
  contents?: FolderItem[]
  duration?: number
}

ipcMain.handle(
  'list-folder-contents',
  async (_event, folderPath: string): Promise<FolderItem[]> => {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm']

    async function getFolderContentsRecursively(currentPath: string): Promise<FolderItem[]> {
      try {
        const items = fs.readdirSync(currentPath)
        const folderItems: FolderItem[] = []

        for (const item of items) {
          if (item.startsWith('._')) {
            continue
          }

          const itemPath = path.join(currentPath, item)
          const stats = fs.statSync(itemPath)

          if (stats.isDirectory()) {
            const subContents = await getFolderContentsRecursively(itemPath)
            folderItems.push({
              name: item,
              path: itemPath,
              type: 'folder',
              contents: subContents
            })
          } else if (stats.isFile()) {
            const ext = path.extname(item).toLowerCase()
            if (videoExtensions.includes(ext) && stats.size > 102400) {
              try {
                const type = await fileTypeFromFile(itemPath)

                if (type && type.mime && type.mime.startsWith('video/')) {
                  let duration: number | undefined
                  try {
                    duration = await getVideoDuration(itemPath)
                  } catch (durationError) {
                    console.error(`Could not get duration for ${itemPath}:`, durationError)
                  }

                  folderItems.push({
                    name: item,
                    path: itemPath,
                    type: 'video',
                    duration
                  })
                }
              } catch (e) {
                console.error(`Could not get file type for ${itemPath}:`, e)
                continue
              }
            }
          }
        }
        return folderItems
      } catch (error) {
        console.error('Error in getFolderContentsRecursively:', error)
        return []
      }
    }

    try {
      const result = await getFolderContentsRecursively(folderPath)
      return result
    } catch (error) {
      console.error('Error listing folder contents:', error)
      return []
    }
  }
)

// Database operations IPC handlers
ipcMain.handle('test-database-connection', async () => {
  return await DatabaseOperations.testConnection()
})

ipcMain.handle('get-all-users', async () => {
  return await DatabaseOperations.getAllUsers()
})

// Get system username
ipcMain.handle('get-system-username', async () => {
  try {
    const username = os.userInfo().username
    return {
      success: true,
      username: username
    }
  } catch (error) {
    console.error('Error getting system username:', error)
    return {
      success: false,
      error: 'Failed to get system username'
    }
  }
})

// Create system user automatically
ipcMain.handle('create-system-user', async (_event, username: string) => {
  return await DatabaseOperations.createSystemUser(username)
})

// Persist and retrieve user course folder
ipcMain.handle('set-user-course-folder', async (_event, userId: number, folderPath: string | null) => {
  return await DatabaseOperations.setUserCourseFolder(userId, folderPath)
})

ipcMain.handle('get-user-course-folder', async (_event, userId: number) => {
  return await DatabaseOperations.getUserCourseFolder(userId)
})
