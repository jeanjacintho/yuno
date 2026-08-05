import { Router } from 'express'
import { listFavorites, setFavorite } from '../services/favorites-store.js'

export const favoritesRouter = Router()

favoritesRouter.get('/', async (_req, res) => {
  try {
    const items = await listFavorites()
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) })
  }
})

favoritesRouter.post('/', async (req, res) => {
  try {
    const dialogId = typeof req.body?.dialogId === 'string' ? req.body.dialogId.trim() : null
    const favorite = req.body?.favorite

    if (!dialogId || typeof favorite !== 'boolean') {
      res.status(400).json({ message: 'dialogId and favorite (boolean) are required' })
      return
    }

    const items = await setFavorite(dialogId, favorite)
    res.json({ ok: true, items })
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) })
  }
})

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}
