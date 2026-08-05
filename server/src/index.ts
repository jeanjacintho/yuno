import 'dotenv/config'
import express from 'express'
import { authRouter } from './routes/auth.js'
import { dialogsRouter } from './routes/dialogs.js'
import { progressRouter } from './routes/progress.js'
import { favoritesRouter } from './routes/favorites.js'
import { streamRouter } from './routes/stream.js'
import { thumbnailRouter } from './routes/thumbnail.js'
import { initTelegramClient } from './services/telegram.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/dialogs', dialogsRouter)
app.use('/api/stream', streamRouter)
app.use('/api/thumbnail', thumbnailRouter)
app.use('/api/progress', progressRouter)
app.use('/api/favorites', favoritesRouter)

async function start() {
  await initTelegramClient()

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
