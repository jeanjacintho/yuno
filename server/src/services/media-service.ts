import bigInt from 'big-integer'
import { Api } from 'telegram'
import type { TelegramClient } from 'telegram'
import type { Response } from 'express'

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
  res: Response
): Promise<void> {
  const { message, fileSize, mimeType } = await getMessageWithMedia(
    client,
    chatId,
    messageId
  )

  const start = range?.start ?? 0
  const end = range?.end ?? fileSize - 1
  const contentLength = end - start + 1

  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Content-Type', mimeType)
  res.setHeader('Content-Length', contentLength.toString())

  if (range) {
    res.status(206)
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
  } else {
    res.status(200)
  }

  const iterator = client.iterDownload({
    file: message.media,
    offset: bigInt(start),
    limit: contentLength,
    requestSize: Math.min(CHUNK_REQUEST_SIZE, contentLength),
    msgData: [chatId, messageId]
  })

  for await (const chunk of iterator) {
    if (!res.write(chunk)) {
      await new Promise<void>((resolve) => res.once('drain', resolve))
    }
  }

  res.end()
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
