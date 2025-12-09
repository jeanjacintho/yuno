import { app, BrowserWindow, protocol } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { setupDatabasePath } from './config/database'
import { createMainWindow } from './window/window-manager'
import { setupIpcHandlers } from './ipc/handlers'
import { DatabaseService } from './services/database-service'
import { setupVideoProtocol } from './protocol/video-protocol'

if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName())
}

setupDatabasePath()

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'video',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Registrar o protocolo antes de criar a janela
  setupVideoProtocol()
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
