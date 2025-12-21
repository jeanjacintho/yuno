import { PrismaClient, type User } from '@prisma/client'
import type { CreateUserResult, DatabaseResult, FolderItem } from '../../shared/types/index'
import path from 'path'

export class DatabaseService {
  private static prisma: PrismaClient | null = null
  private static initialized = false

  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const prisma = this.getPrisma()
      await prisma.$connect()
      this.initialized = true
    }
  }

  private static getPrisma(): PrismaClient {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })
    }
    return this.prisma
  }

  static async testConnection(): Promise<boolean> {
    try {
      await this.ensureInitialized()
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  }

  static async createSystemUser(username: string): Promise<CreateUserResult> {
    await this.ensureInitialized()

    try {
      const email = `${username}@yuno.local`
      const prisma = this.getPrisma()

      const existingByEmail = await prisma.user.findUnique({
        where: { email }
      })

      if (existingByEmail) {
        const updated = await prisma.user.update({
          where: { email },
          data: {
            lastLoginAt: new Date(),
            isActive: true,
            name: username
          }
        })
        return {
          success: true,
          message: 'Usuário já existia; atualizado com sucesso',
          user: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            isActive: updated.isActive,
            lastLoginAt: updated.lastLoginAt ?? undefined
          }
        }
      }

      const created = await prisma.user.create({
        data: {
          name: username,
          email,
          isActive: true,
          lastLoginAt: new Date()
        }
      })

      console.log('Usuário do sistema criado automaticamente:', {
        id: created.id,
        name: created.name,
        email: created.email
      })

      return {
        success: true,
        message: 'Usuário criado automaticamente',
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          isActive: created.isActive,
          lastLoginAt: created.lastLoginAt ?? undefined
        }
      }
    } catch (error) {
      console.error('Erro ao criar usuário do sistema:', error)
      return {
        success: false,
        message: 'Erro ao criar usuário do sistema'
      }
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  static async setUserCourseFolder(
    userId: number,
    folderPath: string | null
  ): Promise<DatabaseResult> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      await prisma.user.update({
        where: { id: userId },
        data: {
          courseFolderPath: folderPath,
          updatedAt: new Date()
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Erro ao salvar courseFolderPath:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async getUserCourseFolder(userId: number): Promise<string | null> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { courseFolderPath: true }
      })

      return user?.courseFolderPath ?? null
    } catch (error) {
      console.error('Erro ao obter courseFolderPath:', error)
      return null
    }
  }

  static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
      this.initialized = false
    }
  }
  static async saveCourseIndex(rootPath: string, items: FolderItem[]): Promise<void> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      const dataJson = JSON.stringify(items)

      // Type assertion needed until TypeScript picks up the regenerated Prisma types
      const courseIndexModel = (prisma as any).courseIndex
      if (!courseIndexModel) {
        throw new Error(
          'courseIndex model not found in Prisma client. Please run: npx prisma generate'
        )
      }

      await courseIndexModel.upsert({
        where: { rootPath },
        update: { data: dataJson },
        create: { rootPath, data: dataJson }
      })
    } catch (error) {
      console.error('Erro ao salvar índice de curso:', error)
      if (error instanceof Error && error.message.includes('courseIndex')) {
        console.error('Prisma client may need to be regenerated. Run: npx prisma generate')
      }
    }
  }

  static async getCourseIndex(rootPath: string): Promise<FolderItem[] | null> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()
      const courseIndexModel = (prisma as any).courseIndex
      if (!courseIndexModel) {
        console.error(
          'courseIndex model not found in Prisma client. Please run: npx prisma generate'
        )
        return null
      }

      const record = await courseIndexModel.findUnique({
        where: { rootPath }
      })

      if (!record?.data) {
        return null
      }

      const parsed = JSON.parse(record.data) as FolderItem[]
      return parsed
    } catch (error) {
      console.error('Erro ao obter índice de curso:', error)
      if (
        error instanceof Error &&
        (error.message.includes('courseIndex') || error.message.includes('Cannot read properties'))
      ) {
        console.error('Prisma client may need to be regenerated. Run: npx prisma generate')
      }
      return null
    }
  }

  // Métodos para estrutura estruturada de cursos
  static async saveCourseStructure(
    rootPath: string,
    items: FolderItem[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      // Processa cada item do nível raiz
      for (const item of items) {
        if (item.type === 'folder') {
          // É um módulo
          await this.saveModule(rootPath, item)
        } else if (item.type === 'video') {
          // Vídeo direto no curso (sem módulo)
          await this.saveVideo(rootPath, item, null, null)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao salvar estrutura de curso:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private static async saveModule(
    rootPath: string,
    moduleItem: FolderItem
  ): Promise<void> {
    const prisma = this.getPrisma()

    // Encontra ou cria o curso
    let course = await prisma.course.findUnique({
      where: { path: rootPath }
    })

    if (!course) {
      course = await prisma.course.create({
        data: {
          name: path.basename(rootPath),
          path: rootPath,
          rootPath
        }
      })
    }

    // Cria ou atualiza o módulo
    const module = await prisma.module.upsert({
      where: { path: moduleItem.path },
      update: {
        name: moduleItem.name,
        updatedAt: new Date()
      },
      create: {
        name: moduleItem.name,
        path: moduleItem.path,
        courseId: course.id
      }
    })

    // Processa conteúdos do módulo
    if (moduleItem.contents) {
      for (const content of moduleItem.contents) {
        if (content.type === 'folder') {
          // É um submodule
          await this.saveSubmodule(module.id, content)
        } else if (content.type === 'video') {
          // Vídeo direto no módulo
          await this.saveVideo(rootPath, content, module.id, null)
        }
      }
    }
  }

  private static async saveSubmodule(
    moduleId: number,
    submoduleItem: FolderItem
  ): Promise<void> {
    const prisma = this.getPrisma()

    const submodule = await prisma.submodule.upsert({
      where: { path: submoduleItem.path },
      update: {
        name: submoduleItem.name,
        updatedAt: new Date()
      },
      create: {
        name: submoduleItem.name,
        path: submoduleItem.path,
        moduleId
      }
    })

    // Processa vídeos do submodule
    if (submoduleItem.contents) {
      for (const content of submoduleItem.contents) {
        if (content.type === 'video') {
          await this.saveVideo('', content, moduleId, submodule.id)
        }
      }
    }
  }

  private static async saveVideo(
    rootPath: string,
    videoItem: FolderItem,
    moduleId: number | null,
    submoduleId: number | null
  ): Promise<void> {
    const prisma = this.getPrisma()

    await prisma.video.upsert({
      where: { path: videoItem.path },
      update: {
        name: videoItem.name,
        duration: videoItem.duration ?? null,
        moduleId: moduleId ?? null,
        submoduleId: submoduleId ?? null,
        updatedAt: new Date()
      },
      create: {
        name: videoItem.name,
        path: videoItem.path,
        duration: videoItem.duration ?? null,
        moduleId: moduleId ?? null,
        submoduleId: submoduleId ?? null
      }
    })
  }

  static async getCourseByPath(coursePath: string): Promise<FolderItem[] | null> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      const course = await prisma.course.findUnique({
        where: { path: coursePath },
        include: {
          modules: {
            include: {
              submodules: {
                include: {
                  videos: true
                }
              },
              videos: true
            },
            orderBy: {
              name: 'asc'
            }
          }
        }
      })

      if (!course) {
        return null
      }

      // Converte para formato FolderItem
      const items: FolderItem[] = course.modules.map((module) => {
        const moduleItem: FolderItem = {
          name: module.name,
          path: module.path,
          type: 'folder',
          contents: []
        }

        // Adiciona submodules
        const submoduleItems: FolderItem[] = module.submodules.map((submodule) => ({
          name: submodule.name,
          path: submodule.path,
          type: 'folder',
          contents: submodule.videos.map((video) => ({
            name: video.name,
            path: video.path,
            type: 'video',
            duration: video.duration ?? undefined
          }))
        }))

        // Adiciona vídeos diretos do módulo
        const moduleVideos: FolderItem[] = module.videos.map((video) => ({
          name: video.name,
          path: video.path,
          type: 'video',
          duration: video.duration ?? undefined
        }))

        moduleItem.contents = [...submoduleItems, ...moduleVideos]
        return moduleItem
      })

      return items
    } catch (error) {
      console.error('Erro ao obter curso por path:', error)
      return null
    }
  }

  static async getModuleByPath(modulePath: string): Promise<FolderItem[] | null> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      const module = await prisma.module.findUnique({
        where: { path: modulePath },
        include: {
          submodules: {
            include: {
              videos: true
            },
            orderBy: {
              name: 'asc'
            }
          },
          videos: {
            orderBy: {
              name: 'asc'
            }
          }
        }
      })

      if (!module) {
        return null
      }

      const items: FolderItem[] = []

      // Adiciona submodules
      for (const submodule of module.submodules) {
        items.push({
          name: submodule.name,
          path: submodule.path,
          type: 'folder',
          contents: submodule.videos.map((video) => ({
            name: video.name,
            path: video.path,
            type: 'video',
            duration: video.duration ?? undefined
          }))
        })
      }

      // Adiciona vídeos diretos
      for (const video of module.videos) {
        items.push({
          name: video.name,
          path: video.path,
          type: 'video',
          duration: video.duration ?? undefined
        })
      }

      return items
    } catch (error) {
      console.error('Erro ao obter módulo por path:', error)
      return null
    }
  }

  static async getSubmoduleByPath(submodulePath: string): Promise<FolderItem[] | null> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      const submodule = await prisma.submodule.findUnique({
        where: { path: submodulePath },
        include: {
          videos: {
            orderBy: {
              name: 'asc'
            }
          }
        }
      })

      if (!submodule) {
        return null
      }

      return submodule.videos.map((video) => ({
        name: video.name,
        path: video.path,
        type: 'video',
        duration: video.duration ?? undefined
      }))
    } catch (error) {
      console.error('Erro ao obter submodule por path:', error)
      return null
    }
  }

  static async getVideosByFolderPath(folderPath: string): Promise<FolderItem[] | null> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      // Tenta encontrar como submodule primeiro
      const submodule = await prisma.submodule.findUnique({
        where: { path: folderPath },
        include: {
          videos: {
            orderBy: {
              name: 'asc'
            }
          }
        }
      })

      if (submodule) {
        return submodule.videos.map((video) => ({
          name: video.name,
          path: video.path,
          type: 'video',
          duration: video.duration ?? undefined
        }))
      }

      // Se não encontrou como submodule, tenta como module
      const module = await prisma.module.findUnique({
        where: { path: folderPath },
        include: {
          videos: {
            orderBy: {
              name: 'asc'
            }
          }
        }
      })

      if (module) {
        return module.videos.map((video) => ({
          name: video.name,
          path: video.path,
          type: 'video',
          duration: video.duration ?? undefined
        }))
      }

      return null
    } catch (error) {
      console.error('Erro ao obter vídeos por path de pasta:', error)
      return null
    }
  }

  static async deleteCourseByRootPath(rootPath: string): Promise<void> {
    try {
      await this.ensureInitialized()
      const prisma = this.getPrisma()

      await prisma.course.deleteMany({
        where: { rootPath }
      })
    } catch (error) {
      console.error('Erro ao deletar curso por rootPath:', error)
    }
  }
}
