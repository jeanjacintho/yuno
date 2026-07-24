import fs from 'fs/promises'
import path from 'path'

const SESSION_PATH = path.join(process.cwd(), 'data', 'session.txt')

export async function loadSession(): Promise<string> {
  try {
    return (await fs.readFile(SESSION_PATH, 'utf-8')).trim()
  } catch {
    return ''
  }
}

export async function saveSession(session: string): Promise<void> {
  await fs.mkdir(path.dirname(SESSION_PATH), { recursive: true })
  await fs.writeFile(SESSION_PATH, session, 'utf-8')
}

export async function clearSession(): Promise<void> {
  try {
    await fs.unlink(SESSION_PATH)
  } catch {
    // no session file yet
  }
}
