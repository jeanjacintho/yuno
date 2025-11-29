import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileTypeFromFile } from 'file-type'
import getVideoDuration from 'get-video-duration'
import type { FolderItem } from '../../shared/types/index'
import {
  VIDEO_EXTENSIONS,
  MIN_VIDEO_SIZE_BYTES,
  HIDDEN_FILE_PREFIX
} from '../../shared/types/index'

export class FileProcessor {
  static async getFolderContentsRecursively(
    currentPath: string
  ): Promise<FolderItem[]> {
    try {
      const items = await fs.readdir(currentPath)

      const processItems = await Promise.all(
        items.map(async (item) => {
          if (item.startsWith(HIDDEN_FILE_PREFIX)) {
            return null
          }

          const itemPath = path.join(currentPath, item)
          const stats = await fs.stat(itemPath)

          if (stats.isDirectory()) {
            const subContents = await this.getFolderContentsRecursively(
              itemPath
            )
            return {
              name: item,
              path: itemPath,
              type: 'folder' as const,
              contents: subContents
            }
          }

          if (stats.isFile()) {
            const ext = path.extname(item).toLowerCase()
            const isValidVideoExtension = VIDEO_EXTENSIONS.includes(
              ext as (typeof VIDEO_EXTENSIONS)[number]
            )
            const isLargeEnough = stats.size > MIN_VIDEO_SIZE_BYTES

            if (isValidVideoExtension && isLargeEnough) {
              return await this.processVideoFile(item, itemPath)
            }
          }

          return null
        })
      )

      return processItems.filter(
        (item): item is FolderItem => item !== null
      )
    } catch (error) {
      console.error('Error in getFolderContentsRecursively:', error)
      return []
    }
  }

  private static async processVideoFile(
    item: string,
    itemPath: string
  ): Promise<FolderItem | null> {
    try {
      const type = await fileTypeFromFile(itemPath)

      if (!type?.mime?.startsWith('video/')) {
        return null
      }

      let duration: number | undefined
      try {
        duration = await getVideoDuration(itemPath)
      } catch (durationError) {
        console.error(`Could not get duration for ${itemPath}:`, durationError)
      }

      return {
        name: item,
        path: itemPath,
        type: 'video',
        duration
      }
    } catch (error) {
      console.error(`Could not get file type for ${itemPath}:`, error)
      return null
    }
  }
}

