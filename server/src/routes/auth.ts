import { Router } from 'express'
import {
  AuthError,
  ConfigError,
  getAuthStatus,
  getUserProfilePhoto,
  logout,
  startAuth,
  verifyAuth
} from '../services/telegram.js'

export const authRouter = Router()

authRouter.get('/status', async (_req, res) => {
  try {
    const status = await getAuthStatus()
    res.json(status)
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) })
  }
})

authRouter.get('/photo', async (_req, res) => {
  try {
    const photo = await getUserProfilePhoto()

    if (!photo) {
      res.status(404).json({ message: 'Photo not found' })
      return
    }

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.send(photo)
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({ message: error.message })
      return
    }

    res.status(500).json({ message: getErrorMessage(error) })
  }
})

authRouter.post('/start', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone)
    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' })
      return
    }

    const result = await startAuth(phone)
    res.json({ ok: true, ...result })
  } catch (error) {
    respondWithAuthError(res, error)
  }
})

authRouter.post('/verify', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone)
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : undefined
    const password =
      typeof req.body?.password === 'string' ? req.body.password : undefined

    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' })
      return
    }

    const result = await verifyAuth({ phone, code, password })

    if (result.requiresPassword) {
      res.json({ ok: true, requiresPassword: true })
      return
    }

    res.json({ ok: true, authenticated: true, user: result.user })
  } catch (error) {
    respondWithAuthError(res, error)
  }
})

authRouter.post('/logout', async (_req, res) => {
  try {
    await logout()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) })
  }
})

function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const phone = value.trim()
  if (!phone.startsWith('+') || phone.length < 8) return null

  return phone
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}

function respondWithAuthError(
  res: import('express').Response,
  error: unknown
): void {
  if (error instanceof ConfigError) {
    res.status(500).json({ message: error.message })
    return
  }

  if (error instanceof AuthError) {
    res.status(400).json({ message: error.message })
    return
  }

  res.status(500).json({ message: getErrorMessage(error) })
}
