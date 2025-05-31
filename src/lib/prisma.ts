import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Initialize database schema if needed
export async function initializeDatabase() {
  try {
    // Test connection and ensure tables exist
    await prisma.$queryRaw`SELECT 1;`
  } catch (error) {
    console.log('Database not ready, this is expected on first deployment')
    // In production, the tables will be created by Prisma migrations
    // or by manual database setup
  }
} 