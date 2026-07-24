import { Router } from 'express'
import { getMessageThumbnail, MediaNotFoundError } from '../services/media-service.js'
import { AuthError, getAuthenticatedClient } from '../services/telegram.js'

export const thumbnailRouter = Router()

thumbnailRouter.get('/:chatId/:messageId', async (req, res) => {
  try {
    const client = await getAuthenticatedClient()
    const messageId = parseMessageId(req.params.messageId)

    if (messageId === null) {
      res.status(400).json({ message: 'messageId must be a number' })
      return
    }

    const thumbnail = await getMessageThumbnail(client, req.params.chatId, messageId)

    if (!thumbnail) {
      res.status(404).json({ message: 'Thumbnail not found' })
      return
    }

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.send(thumbnail)
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
