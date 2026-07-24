import { Router } from 'express'

export const progressRouter = Router()

// POST /api/progress — marca item como assistido
progressRouter.post('/', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})

// GET /api/progress/:chatId — consulta progresso de um grupo
progressRouter.get('/:chatId', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})
