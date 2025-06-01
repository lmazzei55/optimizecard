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
      timeout: 15000, // 15 seconds
      maxWait: 10000, // 10 seconds
    },
  }),
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Force disconnect on serverless functions to prevent connection leaks
if (process.env.NODE_ENV === 'production') {
  // Auto-disconnect after requests in serverless environment
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

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

// Helper function for retrying database operations with more aggressive settings
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 5,  // Increased retries
  baseDelayMs: number = 500  // Shorter initial delay
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // For production, try to reconnect on each attempt
      if (process.env.NODE_ENV === 'production' && attempt > 1) {
        try {
          await prisma.$disconnect()
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }
      
      // Test connection first with a simpler query
      await prisma.$queryRawUnsafe('SELECT 1')
      
      // Then perform the operation
      const result = await operation()
      
      if (attempt > 1) {
        console.log(`✅ Database operation succeeded on attempt ${attempt}`)
      }
      
      return result
    } catch (error: any) {
      lastError = error
      console.log(`❌ Database operation attempt ${attempt}/${maxRetries} failed:`, error?.code || error?.message)
      
      // Check if it's a retryable error
      const isRetryable = (
        error?.code === 'P2010' || 
        error?.code === 'P1001' ||
        error?.code === 'P1017' ||
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('pool')
      )
      
      if (attempt < maxRetries && isRetryable) {
        // Exponential backoff with jitter
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100
        console.log(`🔄 Retrying in ${Math.round(delay)}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // If we've exhausted retries, throw the last error
      console.error(`💥 Database operation failed after ${maxRetries} attempts`)
      throw error
    }
  }
  
  throw lastError
}

// Health check function for monitoring
export async function healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const startTime = Date.now()
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    const latency = Date.now() - startTime
    return { healthy: true, latency }
  } catch (error: any) {
    return { healthy: false, error: error?.message || 'Unknown error' }
  }
} 