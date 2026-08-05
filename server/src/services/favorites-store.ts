import fs from 'fs/promises'
import path from 'path'

const FAVORITES_PATH = path.join(process.cwd(), 'data', 'favorites.json')

async function readFavorites(): Promise<string[]> {
  try {
    const raw = await fs.readFile(FAVORITES_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

async function writeFavorites(favorites: string[]): Promise<void> {
  await fs.mkdir(path.dirname(FAVORITES_PATH), { recursive: true })
  await fs.writeFile(FAVORITES_PATH, JSON.stringify(favorites, null, 2), 'utf-8')
}

export async function listFavorites(): Promise<string[]> {
  return readFavorites()
}

export async function setFavorite(dialogId: string, favorite: boolean): Promise<string[]> {
  const favorites = await readFavorites()
  const withoutId = favorites.filter((id) => id !== dialogId)

  const next = favorite ? [...withoutId, dialogId] : withoutId
  await writeFavorites(next)

  return next
}
