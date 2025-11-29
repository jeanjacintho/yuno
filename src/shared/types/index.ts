export interface FolderItem {
  name: string
  path: string
  type: 'folder' | 'video'
  contents?: FolderItem[]
  duration?: number
}

export interface SystemUsernameResult {
  success: boolean
  username?: string
  error?: string
}

export interface CreateUserResult {
  success: boolean
  message?: string
  user?: {
    id: number
    name: string
    email: string
    isActive: boolean
    lastLoginAt?: Date | string
  }
}

export interface DatabaseResult {
  success: boolean
  error?: string
}

export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.webm'
] as const

export const MIN_VIDEO_SIZE_BYTES = 102400

export const HIDDEN_FILE_PREFIX = '._'

