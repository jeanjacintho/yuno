import { Router } from 'express'
import {
  getDialogPhoto,
  listDialogMedia,
  listDialogs
} from '../services/dialogs-service.js'
import { AuthError, getAuthenticatedClient } from '../services/telegram.js'

export const dialogsRouter = Router()

dialogsRouter.get('/', async (_req, res) => {
  try {
    const client = await getAuthenticatedClient()
    const dialogs = await listDialogs(client)
    res.json({ items: dialogs })
  } catch (error) {
    respondWithError(res, error)
  }
})

dialogsRouter.get('/:id/photo', async (req, res) => {
  try {
    const client = await getAuthenticatedClient()
    const photo = await getDialogPhoto(client, req.params.id)

    if (!photo) {
      res.status(404).json({ message: 'Photo not found' })
      return
    }

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.send(photo)
  } catch (error) {
    respondWithError(res, error)
  }
})

dialogsRouter.get('/:id/media', async (req, res) => {
  try {
    const client = await getAuthenticatedClient()
    const offsetId = parseOffsetId(req.query.offsetId)

    if (req.query.offsetId !== undefined && offsetId === null) {
      res.status(400).json({ message: 'offsetId must be a number' })
      return
    }

    const media = await listDialogMedia(client, req.params.id, offsetId ?? undefined)
    res.json(media)
  } catch (error) {
    respondWithError(res, error)
  }
})

function parseOffsetId(value: unknown): number | undefined | null {
  if (value === undefined || value === '') return undefined

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

  const message = error instanceof Error ? error.message : 'Unexpected error'
  res.status(500).json({ message })
}
