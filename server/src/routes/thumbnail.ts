import { Router } from 'express'

export const thumbnailRouter = Router()

// GET /api/thumbnail/:chatId/:messageId — miniatura da mídia
thumbnailRouter.get('/:chatId/:messageId', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})
