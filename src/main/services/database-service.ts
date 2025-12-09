import { PrismaClient, type User } from '@prisma/client'
import type { CreateUserResult, DatabaseResult, FolderItem } from '../../shared/types/index'

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
}
