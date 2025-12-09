import { protocol } from 'electron'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { stat } from 'node:fs/promises'

export function setupVideoProtocol(): void {
  // Primeiro, tenta interceptar o protocolo padrão de arquivo para permitir file://
  // Mas vamos usar registerStreamProtocol para melhor compatibilidade
  protocol.registerStreamProtocol('video', async (request, callback) => {
    try {
      // Remove o protocolo e decodifica a URL
      let filePath = request.url.replace(/^video:\/\//, '')

      // Remove query strings se houver
      const queryIndex = filePath.indexOf('?')
      if (queryIndex !== -1) {
        filePath = filePath.substring(0, queryIndex)
      }

      // Remove fragmentos se houver
      const fragmentIndex = filePath.indexOf('#')
      if (fragmentIndex !== -1) {
        filePath = filePath.substring(0, fragmentIndex)
      }

      const decodedPath = decodeURIComponent(filePath)

      console.log('[Video Protocol] Request URL:', request.url)
      console.log('[Video Protocol] Decoded path:', decodedPath)

      // Verifica se o arquivo existe
      const stats = await stat(decodedPath)

      if (!stats.isFile()) {
        console.error('[Video Protocol] Path is not a file:', decodedPath)
        callback({ statusCode: 404 })
        return
      }

      // Normaliza o caminho para garantir que seja absoluto
      const normalizedPath = path.normalize(decodedPath)
      console.log('[Video Protocol] Serving file:', normalizedPath)

      // Cria um stream do arquivo
      const stream = createReadStream(normalizedPath)

      // Determina o tipo MIME baseado na extensão
      const ext = path.extname(normalizedPath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska'
      }
      const mimeType = mimeTypes[ext] || 'video/mp4'

      callback({
        statusCode: 200,
        headers: {
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
          'Content-Length': stats.size.toString()
        },
        data: stream
      })
    } catch (error) {
      console.error('[Video Protocol] Error serving video file:', error)
      if (error instanceof Error) {
        console.error('[Video Protocol] Error message:', error.message)
        console.error('[Video Protocol] Error stack:', error.stack)
      }
      callback({ statusCode: 500 })
    }
  })

  console.log('[Video Protocol] Video protocol registered successfully')
}
