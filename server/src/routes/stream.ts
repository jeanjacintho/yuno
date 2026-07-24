import { Router } from 'express'

export const streamRouter = Router()

// GET /api/stream/:chatId/:messageId — streaming com suporte a Range
streamRouter.get('/:chatId/:messageId', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})
