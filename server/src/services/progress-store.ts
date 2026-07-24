import fs from 'fs/promises'
import path from 'path'

type ProgressEntry = {
  chatId: string
  messageId: string
  watched: boolean
  watchedAt?: string
}

type ProgressStore = Record<string, ProgressEntry>

const PROGRESS_PATH = path.join(process.cwd(), 'data', 'progress.json')

async function readStore(): Promise<ProgressStore> {
  try {
    const raw = await fs.readFile(PROGRESS_PATH, 'utf-8')
    return JSON.parse(raw) as ProgressStore
  } catch {
    return {}
  }
}

async function writeStore(store: ProgressStore): Promise<void> {
  await fs.mkdir(path.dirname(PROGRESS_PATH), { recursive: true })
  await fs.writeFile(PROGRESS_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

function progressKey(chatId: string, messageId: string): string {
  return `${chatId}:${messageId}`
}

export async function getChatProgress(chatId: string): Promise<Record<string, boolean>> {
  const store = await readStore()
  const result: Record<string, boolean> = {}

  for (const entry of Object.values(store)) {
    if (entry.chatId === chatId && entry.watched) {
      result[entry.messageId] = true
    }
  }

  return result
}

export async function setProgress(input: {
  chatId: string
  messageId: string
  watched: boolean
}): Promise<void> {
  const store = await readStore()
  const key = progressKey(input.chatId, input.messageId)

  store[key] = {
    chatId: input.chatId,
    messageId: input.messageId,
    watched: input.watched,
    watchedAt: input.watched ? new Date().toISOString() : undefined
  }

  await writeStore(store)
}
