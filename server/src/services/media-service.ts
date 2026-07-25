import bigInt from 'big-integer'
import { Api } from 'telegram'
import type { TelegramClient } from 'telegram'
import type { Request, Response } from 'express'

export class MediaNotFoundError extends Error {
  constructor() {
    super('Media not found')
    this.name = 'MediaNotFoundError'
  }
}

type MediaSource = {
  message: Api.Message
  fileSize: number
  mimeType: string
  fileName: string
}

const CHUNK_REQUEST_SIZE = 512 * 1024

export async function getMessageWithMedia(
  client: TelegramClient,
  chatId: string,
  messageId: number
): Promise<MediaSource> {
  const entity = await client.getEntity(chatId)
  const messages = await client.getMessages(entity, { ids: [messageId] })
  const message = messages[0]

  if (!message?.media) {
    throw new MediaNotFoundError()
  }

  const details = extractMediaDetails(message)
  if (!details) {
    throw new MediaNotFoundError()
  }

  return {
    message,
    ...details
  }
}

export async function streamMessageMedia(
  client: TelegramClient,
  chatId: string,
  messageId: number,
  range: { start: number; end: number } | null,
  req: Request,
  res: Response
): Promise<void> {
  const { message, fileSize, mimeType } = await getMessageWithMedia(
    client,
    chatId,
    messageId
  )

  const hasKnownSize = fileSize > 0
  const start = range?.start ?? 0
  const end = range?.end ?? (hasKnownSize ? fileSize - 1 : undefined)

  let contentLength: number | undefined
  if (end !== undefined) {
    contentLength = end - start + 1
  }

  res.setHeader('Accept-Ranges', hasKnownSize ? 'bytes' : 'none')
  res.setHeader('Content-Type', mimeType)

  if (range && hasKnownSize && end !== undefined && contentLength !== undefined) {
    res.status(206)
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
    res.setHeader('Content-Length', contentLength.toString())
  } else if (contentLength !== undefined) {
    res.status(200)
    res.setHeader('Content-Length', contentLength.toString())
  } else {
    res.status(200)
  }

  let aborted = false
  const onAbort = () => {
    aborted = true
  }

  req.on('aborted', onAbort)
  req.on('close', onAbort)
  res.on('close', onAbort)

  try {
    const iterator = client.iterDownload({
      file: message.media,
      offset: bigInt(start),
      limit: contentLength,
      requestSize: Math.min(
        CHUNK_REQUEST_SIZE,
        contentLength ?? CHUNK_REQUEST_SIZE
      ),
      msgData: [chatId, messageId]
    })

    let bytesWritten = 0

    for await (const chunk of iterator) {
      if (aborted || res.writableEnded) {
        break
      }

      let payload: Buffer = chunk
      if (contentLength !== undefined) {
        const remaining = contentLength - bytesWritten
        if (remaining <= 0) {
          break
        }

        if (payload.length > remaining) {
          payload = payload.subarray(0, remaining)
        }
      }

      bytesWritten += payload.length

      try {
        const canContinue = res.write(payload)
        if (!canContinue) {
          await new Promise<void>((resolve) => {
            res.once('drain', resolve)
          })
        }
      } catch {
        aborted = true
        break
      }
    }
  } finally {
    req.off('aborted', onAbort)
    req.off('close', onAbort)
    res.off('close', onAbort)

    if (!res.writableEnded) {
      res.end()
    }
  }
}

export async function getMessageThumbnail(
  client: TelegramClient,
  chatId: string,
  messageId: number
): Promise<Buffer | null> {
  const { message } = await getMessageWithMedia(client, chatId, messageId)
  const buffer = await client.downloadMedia(message, { thumb: 0 })

  if (!buffer || !(buffer instanceof Buffer)) {
    return null
  }

  return buffer
}

function extractMediaDetails(message: Api.Message): {
  fileSize: number
  mimeType: string
  fileName: string
} | null {
  if (message.media instanceof Api.MessageMediaDocument) {
    const document = message.media.document
    if (!(document instanceof Api.Document)) return null

    return {
      fileSize: Number(document.size ?? 0),
      mimeType: document.mimeType ?? 'application/octet-stream',
      fileName: getDocumentFileName(document)
    }
  }

  if (message.media instanceof Api.MessageMediaPhoto) {
    const photo = message.media.photo
    if (!(photo instanceof Api.Photo)) return null

    const largestSize = photo.sizes[photo.sizes.length - 1]
    const fileSize =
      largestSize instanceof Api.PhotoSize ? Number(largestSize.size ?? 0) : 0

    return {
      fileSize,
      mimeType: 'image/jpeg',
      fileName: `photo_${message.id}.jpg`
    }
  }

  return null
}

function getDocumentFileName(document: Api.Document): string {
  for (const attribute of document.attributes) {
    if (attribute instanceof Api.DocumentAttributeFilename) {
      return attribute.fileName
    }
  }

  return 'Untitled'
}
