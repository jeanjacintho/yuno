import { parentPort } from 'node:worker_threads'
import { FileProcessor } from '../services/file-processor'
import type { FolderItem } from '../../shared/types'

if (!parentPort) {
  throw new Error('course-indexer worker must be started as a Worker thread')
}

interface IndexMessage {
  type: 'full-index'
  rootPath: string
}

interface IndexDoneMessage {
  type: 'done'
  rootPath: string
  items: FolderItem[]
  totalFolders: number
  totalVideos: number
}

interface IndexErrorMessage {
  type: 'error'
  rootPath: string
  error: string
}

parentPort.on('message', async (msg: IndexMessage) => {
  if (msg.type !== 'full-index') return

  const { rootPath } = msg

  try {
    const items = await FileProcessor.getFolderContentsRecursively(rootPath)

    let totalFolders = 0
    let totalVideos = 0

    const walk = (nodes: FolderItem[]): void => {
      for (const node of nodes) {
        if (node.type === 'folder') {
          totalFolders += 1
          if (node.contents) {
            walk(node.contents)
          }
        } else if (node.type === 'video') {
          totalVideos += 1
        }
      }
    }

    walk(items)

    const doneMessage: IndexDoneMessage = {
      type: 'done',
      rootPath,
      items,
      totalFolders,
      totalVideos
    }

    parentPort!.postMessage(doneMessage)
  } catch (error) {
    const errorMsg: IndexErrorMessage = {
      type: 'error',
      rootPath,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    parentPort!.postMessage(errorMsg)
  }
})
