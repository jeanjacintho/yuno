import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import type { FolderItem } from '../../shared/types'
import { DatabaseService } from './database-service'

type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

interface IndexJob {
  id: string
  rootPath: string
  status: JobStatus
  totalFolders?: number
  totalVideos?: number
  error?: string
}

interface WorkerDoneMessage {
  type: 'done'
  rootPath: string
  items: FolderItem[]
  totalFolders: number
  totalVideos: number
}

interface WorkerErrorMessage {
  type: 'error'
  rootPath: string
  error: string
}

type WorkerMessage = WorkerDoneMessage | WorkerErrorMessage

export class CourseIndexService {
  private static jobs = new Map<string, IndexJob>()
  private static workers = new Map<string, Worker>()

  static startIndex(rootPath: string): string {
    const existingJob = Array.from(this.jobs.values()).find(
      (job) => job.rootPath === rootPath && job.status === 'running'
    )

    if (existingJob) {
      return existingJob.id
    }

    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const job: IndexJob = {
      id: jobId,
      rootPath,
      status: 'pending'
    }

    this.jobs.set(jobId, job)

    const workerPath = join(__dirname, '../workers/course-indexer.js')
    const worker = new Worker(workerPath)

    this.workers.set(jobId, worker)

    job.status = 'running'

    worker.on('message', async (msg: WorkerMessage) => {
      const currentJob = this.jobs.get(jobId)
      if (!currentJob) {
        return
      }

      if (msg.type === 'done') {
        currentJob.status = 'completed'
        currentJob.totalFolders = msg.totalFolders
        currentJob.totalVideos = msg.totalVideos

        await DatabaseService.saveCourseIndex(msg.rootPath, msg.items)
      } else if (msg.type === 'error') {
        currentJob.status = 'failed'
        currentJob.error = msg.error
      }
    })

    worker.on('error', (error) => {
      const currentJob = this.jobs.get(jobId)
      if (currentJob) {
        currentJob.status = 'failed'
        currentJob.error = error.message
      }
    })

    worker.on('exit', () => {
      this.workers.delete(jobId)
    })

    worker.postMessage({ type: 'full-index', rootPath })

    return jobId
  }

  static getStatus(jobId: string): IndexJob | null {
    const job = this.jobs.get(jobId)
    return job ?? null
  }
}
