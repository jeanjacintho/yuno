import { PrismaClient, type User } from '@prisma/client'

export class DatabaseOperations {
  private static prisma: PrismaClient | null = null
  private static initialized = false

  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const prisma = this.getPrisma()
      await prisma.$connect()

      // Verificar se as tabelas existem, se não criar
      try {
        await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
      } catch {
        console.log('Tabelas não encontradas, criando schema...')

        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            isActive BOOLEAN DEFAULT true NOT NULL,
            lastLoginAt DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
          )`

        console.log('Schema criado com sucesso!')
      }

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

  static async createSystemUser(
    username: string
  ): Promise<{ success: boolean; message?: string; user?: User }> {
    await this.ensureInitialized()

    try {
      const email = `${username}@yuno.local`

      // Tentar localizar por email (único)
      const existingByEmail = await this.prisma!.user.findUnique({
        where: { email }
      })

      if (existingByEmail) {
        const updated = await this.prisma!.user.update({
          where: { email },
          data: { lastLoginAt: new Date(), isActive: true, name: username }
        })
        return {
          success: true,
          message: 'Usuário já existia; atualizado com sucesso',
          user: updated
        }
      }

      // Não existe: criar
      const created = await this.prisma!.user.create({
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
        user: created
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
      return [] as User[]
    }
  }

  static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
    }
  }
}
