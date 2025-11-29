import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'node:fs'
import icon from '../../../resources/icon.png?asset'
import { is } from '@electron-toolkit/utils'

export function createMainWindow(): BrowserWindow {
  const preloadPath = join(__dirname, '../preload/index.js')
  
  console.log('[Main] Preload path:', preloadPath)
  console.log('[Main] Preload exists:', existsSync(preloadPath))
  
  if (!existsSync(preloadPath)) {
    console.error('[Main] ERRO: Preload não encontrado em:', preloadPath)
    console.error('[Main] __dirname:', __dirname)
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Window finished loading')
    mainWindow.webContents.executeJavaScript(`
      console.log('[Renderer] window.api available:', typeof window.api !== 'undefined');
      console.log('[Renderer] window.electron available:', typeof window.electron !== 'undefined');
    `).catch(console.error)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../../renderer/index.html'))
  }

  return mainWindow
}

