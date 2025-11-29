import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { setupDatabasePath } from './config/database'
import { createMainWindow } from './window/window-manager'
import { setupIpcHandlers } from './ipc/handlers'
import { DatabaseService } from './services/database-service'

if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName())
}

setupDatabasePath()

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await DatabaseService.disconnect()
})
