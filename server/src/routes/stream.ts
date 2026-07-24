import { Router } from 'express'
import {
  getMessageWithMedia,
  MediaNotFoundError,
  streamMessageMedia
} from '../services/media-service.js'
import { AuthError, getAuthenticatedClient } from '../services/telegram.js'
import { parseRangeHeader } from '../utils/range.js'

export const streamRouter = Router()

streamRouter.get('/:chatId/:messageId', async (req, res) => {
  try {
    const client = await getAuthenticatedClient()
    const messageId = parseMessageId(req.params.messageId)

    if (messageId === null) {
      res.status(400).json({ message: 'messageId must be a number' })
      return
    }

    const { fileSize } = await getMessageWithMedia(client, req.params.chatId, messageId)
    const parsedRange = parseRangeHeader(req.headers.range, fileSize)

    if (parsedRange === 'invalid') {
      res.status(416).json({ message: 'Invalid Range header' })
      return
    }

    await streamMessageMedia(client, req.params.chatId, messageId, parsedRange, res)
  } catch (error) {
    respondWithError(res, error)
  }
})

function parseMessageId(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function respondWithError(res: import('express').Response, error: unknown): void {
  if (res.headersSent) {
    res.end()
    return
  }

  if (error instanceof AuthError) {
    res.status(401).json({ message: error.message })
    return
  }

  if (error instanceof MediaNotFoundError) {
    res.status(404).json({ message: error.message })
    return
  }

  const message = error instanceof Error ? error.message : 'Unexpected error'
  res.status(500).json({ message })
}
