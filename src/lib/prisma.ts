import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use direct connection for production to avoid pooling issues
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use direct connection in production to avoid Supabase pooling issues
    return process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
  }
  return process.env.DATABASE_URL
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Simplified configuration for direct connection
  ...(process.env.NODE_ENV === 'production' && {
    transactionOptions: {
      timeout: 20000, // 20 seconds for direct connection
    },
  }),
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Simplified connection management for direct connection
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

// Simplified retry logic for direct connection
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3,  // Reduced retries for direct connection
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Simple connection test
      if (attempt > 1) {
        await prisma.$queryRawUnsafe('SELECT 1')
      }
      
      // Perform the operation
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
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout')
      )
      
      if (attempt < maxRetries && isRetryable) {
        const delay = baseDelayMs * attempt
        console.log(`🔄 Retrying in ${delay}ms...`)
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