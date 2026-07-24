import { Router } from 'express'

export const authRouter = Router()

// POST /api/auth/start — envia código de verificação
authRouter.post('/start', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})

// POST /api/auth/verify — confirma código e senha 2FA
authRouter.post('/verify', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' })
})
