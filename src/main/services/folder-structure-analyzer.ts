import path from 'node:path'
import type { FolderStructureInfo, FolderLevelInfo } from '../../shared/types/folder-structure'
import type { FolderItem } from '../../shared/types/index'

export class FolderStructureAnalyzer {
  static analyzeStructureFromItems(
    folderItems: FolderItem[],
    rootPath: string
  ): FolderStructureInfo {
    const structure: FolderLevelInfo[] = []
    let maxDepth = 0
    let videoDepth = 0
    let totalFolders = 0
    let totalVideos = 0

    const analyzeFromFolderItems = (
      items: FolderItem[],
      currentLevel: number
    ): { hasDirectVideos: boolean; videoCount: number; subfolderCount: number } => {
      let videoCount = 0
      let subfolderCount = 0
      let hasDirectVideos = false

      for (const item of items) {
        if (item.type === 'video') {
          videoCount++
          totalVideos++
          hasDirectVideos = true

          if (currentLevel > videoDepth) {
            videoDepth = currentLevel
          }
        } else if (item.type === 'folder') {
          subfolderCount++
          totalFolders++

          if (item.contents) {
            analyzeFromFolderItems(item.contents, currentLevel + 1)

            if (currentLevel + 1 > maxDepth) {
              maxDepth = currentLevel + 1
            }
          }
        }
      }

      if (currentLevel > maxDepth) {
        maxDepth = currentLevel
      }

      return {
        hasDirectVideos,
        videoCount,
        subfolderCount
      }
    }

    const buildLevelInfo = (
      items: FolderItem[],
      currentLevel: number,
      currentPath: string
    ): void => {
      let videoCount = 0
      let subfolderCount = 0
      let hasVideosInThisLevel = false

      for (const item of items) {
        if (item.type === 'video') {
          videoCount++
          hasVideosInThisLevel = true
        } else if (item.type === 'folder') {
          subfolderCount++
        }
      }

      const folderName = path.basename(currentPath)
      const folderType = this.getFolderType(currentLevel, videoDepth, maxDepth)

      structure.push({
        level: currentLevel,
        type: folderType,
        path: currentPath,
        name: folderName,
        hasVideos: hasVideosInThisLevel,
        hasSubfolders: subfolderCount > 0,
        videoCount,
        subfolderCount
      })

      if (subfolderCount > 0 && currentLevel < videoDepth) {
        for (const item of items) {
          if (item.type === 'folder' && item.contents) {
            buildLevelInfo(item.contents, currentLevel + 1, item.path)
          }
        }
      }
    }

    analyzeFromFolderItems(folderItems, 0)

    buildLevelInfo(folderItems, 0, rootPath)

    return {
      maxDepth,
      videoDepth,
      totalFolders,
      totalVideos,
      structure
    }
  }

  static getFolderType(
    currentLevel: number,
    videoDepth: number,
    maxDepth: number
  ): 'course' | 'module' | 'lesson' {
    if (currentLevel === 0) {
      return 'course'
    }

    if (currentLevel === videoDepth) {
      return 'lesson'
    }

    if (currentLevel > 0 && currentLevel < videoDepth) {
      return 'module'
    }

    if (currentLevel === maxDepth && videoDepth === maxDepth) {
      return 'lesson'
    }

    return 'module'
  }

  static async getFolderTypeForPath(
    folderPath: string,
    rootPath: string,
    structureInfo: FolderStructureInfo
  ): Promise<'course' | 'module' | 'lesson'> {
    const relativePath = path.relative(rootPath, folderPath)
    const depth = relativePath.split(path.sep).filter((p) => p !== '').length

    return this.getFolderType(depth, structureInfo.videoDepth, structureInfo.maxDepth)
  }
}
