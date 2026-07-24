import { Api } from 'telegram'
import type { TelegramClient } from 'telegram'
import type {
  DialogItem,
  DialogType,
  MediaItem,
  MediaListResponse,
  MediaType
} from '../types/dialogs.js'

const MEDIA_PAGE_SIZE = 50

export async function listDialogs(client: TelegramClient): Promise<DialogItem[]> {
  const dialogs = await client.getDialogs({})

  return dialogs
    .filter((dialog) => dialog.isGroup || dialog.isChannel)
    .map((dialog) => {
      const entity = dialog.entity
      let type: DialogType = 'group'

      if (dialog.isChannel) {
        type = entity instanceof Api.Channel && entity.megagroup ? 'supergroup' : 'channel'
      }

      return {
        id: dialog.id?.toString() ?? '',
        title: dialog.title ?? dialog.name ?? 'Untitled',
        type,
        hasPhoto: Boolean(dialog.entity && 'photo' in dialog.entity && dialog.entity.photo)
      }
    })
    .filter((dialog) => dialog.id)
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function listDialogMedia(
  client: TelegramClient,
  chatId: string,
  offsetId?: number
): Promise<MediaListResponse> {
  const entity = await client.getEntity(chatId)
  const messages = await client.getMessages(entity, {
    limit: MEDIA_PAGE_SIZE,
    offsetId: offsetId ?? 0
  })

  const items = messages
    .map((message) => mapMessageMedia(message))
    .filter((item): item is MediaItem => item !== null)

  const lastMessage = messages[messages.length - 1]
  const nextOffsetId =
    messages.length === MEDIA_PAGE_SIZE && lastMessage?.id
      ? Number(lastMessage.id)
      : null

  return { items, nextOffsetId }
}

export async function getDialogPhoto(
  client: TelegramClient,
  chatId: string
): Promise<Buffer | null> {
  const photo = await client.downloadProfilePhoto(chatId, { isBig: false })
  if (!photo || !(photo instanceof Buffer)) {
    return null
  }

  return photo
}

function mapMessageMedia(message: Api.Message): MediaItem | null {
  if (!message.media) return null

  if (message.media instanceof Api.MessageMediaDocument) {
    const document = message.media.document
    if (!(document instanceof Api.Document)) return null

    const fileName = getDocumentFileName(document)
    const type = getDocumentMediaType(document)

    return {
      messageId: message.id.toString(),
      fileName,
      type,
      size: Number(document.size ?? 0),
      date: message.date,
      hasThumbnail: Boolean(document.thumbs?.length)
    }
  }

  if (message.media instanceof Api.MessageMediaPhoto) {
    return {
      messageId: message.id.toString(),
      fileName: `photo_${message.id}.jpg`,
      type: 'photo',
      size: 0,
      date: message.date,
      hasThumbnail: true
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

function getDocumentMediaType(document: Api.Document): MediaType {
  const mimeType = document.mimeType ?? ''

  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'pdf'

  const isVideo = document.attributes.some(
    (attribute) => attribute instanceof Api.DocumentAttributeVideo
  )
  if (isVideo) return 'video'

  return 'document'
}
