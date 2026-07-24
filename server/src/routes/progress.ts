import { Router } from 'express'
import { getChatProgress, setProgress } from '../services/progress-store.js'
import { AuthError } from '../services/telegram.js'

export const progressRouter = Router()

progressRouter.post('/', async (req, res) => {
  try {
    const chatId = typeof req.body?.chatId === 'string' ? req.body.chatId : null
    const messageId =
      typeof req.body?.messageId === 'string' ? req.body.messageId : null
    const watched = req.body?.watched

    if (!chatId || !messageId || typeof watched !== 'boolean') {
      res.status(400).json({
        message: 'chatId, messageId, and watched (boolean) are required'
      })
      return
    }

    await setProgress({ chatId, messageId, watched })
    res.json({ ok: true })
  } catch (error) {
    respondWithError(res, error)
  }
})

progressRouter.get('/:chatId', async (req, res) => {
  try {
    const progress = await getChatProgress(req.params.chatId)
    res.json({ items: progress })
  } catch (error) {
    respondWithError(res, error)
  }
})

function respondWithError(res: import('express').Response, error: unknown): void {
  if (error instanceof AuthError) {
    res.status(401).json({ message: error.message })
    return
  }

  const message = error instanceof Error ? error.message : 'Unexpected error'
  res.status(500).json({ message })
}
