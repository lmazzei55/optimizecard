import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Add connection pool settings for better Vercel compatibility
  ...(process.env.NODE_ENV === 'production' && {
    transactionOptions: {
      timeout: 10000, // 10 seconds
    },
  }),
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Initialize database schema if needed
export async function initializeDatabase() {
  try {
    // Test connection with a simple query that doesn't use prepared statements
    const result = await prisma.$queryRawUnsafe('SELECT 1 as test')
    console.log('Database connection test successful')
    return true
  } catch (error) {
    console.log('Database connection failed:', error)
    return false
  }
}

// Helper function for retrying database operations
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Test connection first
      await prisma.$queryRawUnsafe('SELECT 1')
      // Then perform the operation
      return await operation()
    } catch (error: any) {
      lastError = error
      console.log(`Database operation attempt ${attempt} failed:`, error?.message)
      
      if (attempt < maxRetries && (
        error?.code === 'P2010' || 
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('connection')
      )) {
        console.log(`Retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
} 