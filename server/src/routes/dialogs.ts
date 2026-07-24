import { Router } from 'express'

export const dialogsRouter = Router()

// GET /api/dialogs — lista grupos/canais
dialogsRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})

// GET /api/dialogs/:id/media — lista mídias de um grupo
dialogsRouter.get('/:id/media', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})
