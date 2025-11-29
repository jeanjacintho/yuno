import path from 'node:path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

export function setupDatabasePath(): void {
  const dbPath = is.dev
    ? path.join(__dirname, '../../prisma/dev.db')
    : path.join(app.getPath('userData'), 'prod.db')

  process.env.DATABASE_URL = `file:${dbPath}`
}

