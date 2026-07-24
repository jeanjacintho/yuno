export type DialogType = 'group' | 'channel' | 'supergroup'

export type DialogItem = {
  id: string
  title: string
  type: DialogType
  hasPhoto: boolean
}

export type MediaType = 'video' | 'pdf' | 'photo' | 'document'

export type MediaItem = {
  messageId: string
  fileName: string
  type: MediaType
  size: number
  date: number
  hasThumbnail: boolean
}

export type MediaListResponse = {
  items: MediaItem[]
  nextOffsetId: number | null
}
