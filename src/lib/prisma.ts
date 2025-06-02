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
  // Conservative settings for pooled connection
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

// Conservative retry logic that won't break authentication
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 2,  // Reduced to prevent auth timeouts
  baseDelayMs: number = 500
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Perform the operation directly for first attempt
      const result = await operation()
      
      if (attempt > 1) {
        console.log(`✅ Database operation succeeded on attempt ${attempt}`)
      }
      
      return result
    } catch (error: any) {
      lastError = error
      console.log(`❌ Database operation attempt ${attempt}/${maxRetries} failed:`, error?.code || error?.message)
      
      // Only retry on specific connection errors, not auth errors
      const isRetryable = (
        error?.code === 'P2010' && 
        attempt < maxRetries
      )
      
      if (isRetryable) {
        const delay = baseDelayMs * attempt
        console.log(`🔄 Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry if it's not a clear connection error
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