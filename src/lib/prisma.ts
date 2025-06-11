import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Function to create a new Prisma client
function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Enhanced settings for serverless cold starts and connection pooling
    ...(process.env.NODE_ENV === 'production' && {
      transactionOptions: {
        timeout: 30000, // 30 seconds for cold starts
      },
    }),
  })
}

export let prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Function to reset Prisma client completely
export async function resetPrismaClient() {
  try {
    console.log('🔄 Resetting Prisma client due to connection issues...')
    await prisma.$disconnect()
    prisma = createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma
    }
    console.log('✅ Prisma client reset successfully')
  } catch (error) {
    console.warn('⚠️ Error during Prisma client reset:', error)
  }
}

// Connection cleanup for serverless
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.warn('Error disconnecting Prisma:', error)
  }
}

// Initialize database schema if needed
export async function initializeDatabase() {
  try {
    // Use a simple operation instead of raw queries to avoid prepared statement issues
    await prisma.spendingCategory.count()
    console.log('Database connection test successful')
    return true
  } catch (error) {
    console.log('Database connection failed:', error)
    return false
  }
}

// Enhanced retry logic for serverless cold starts
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 4,  // Increased for cold starts
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      
      if (attempt > 1) {
        console.log(`✅ Database operation succeeded on attempt ${attempt}`)
      }
      
      return result
    } catch (error: any) {
      lastError = error
      console.log(`❌ Database operation attempt ${attempt}/${maxRetries} failed:`, error?.code || error?.message)
      
      // Enhanced retry conditions for serverless environments
      const isRetryable = (
        (error?.code === 'P2010' || // Connection error
         error?.code === 'P2024' || // Timeout
         error?.code === 'P1001' || // Can't reach database
         error?.code === '42P05' || // Prepared statement exists
         error?.message?.includes('timeout') ||
         error?.message?.includes('connection') ||
         error?.message?.includes('prepared statement') ||
         error?.message?.includes('ECONNRESET') ||
         error?.message?.includes('ETIMEDOUT')) && 
        attempt < maxRetries
      )
      
      if (isRetryable) {
        // For prepared statement conflicts, reset the entire client
        if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
          console.log('🔄 Prepared statement conflict detected, resetting Prisma client...')
          await resetPrismaClient()
          // Longer delay for client reset
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          // For other connection issues, just disconnect and reconnect
          try {
            await disconnectPrisma()
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (disconnectError) {
            console.warn('Error during disconnect:', disconnectError)
          }
        }
        
        // Exponential backoff with jitter for cold starts
        const jitter = Math.random() * 500
        const delay = (baseDelayMs * Math.pow(2, attempt - 1)) + jitter
        console.log(`🔄 Retrying in ${Math.round(delay)}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry if it's not a clear connection error
      throw error
    }
  }
  
  throw lastError
}

// Health check function for monitoring - using simple operations instead of raw queries
export async function healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const startTime = Date.now()
  try {
    // Use a simple count operation instead of raw queries to avoid prepared statement issues
    await prisma.spendingCategory.count()
    const latency = Date.now() - startTime
    return { healthy: true, latency }
  } catch (error: any) {
    return { healthy: false, error: error?.message || 'Unknown error' }
  }
}

// Pre-warming function for critical database operations
export async function warmupDatabase(): Promise<{ success: boolean; operations: string[]; errors: string[] }> {
  const operations: string[] = []
  const errors: string[] = []
  
  const warmupTasks = [
    {
      name: 'categories',
      task: async () => {
        await withRetry(async () => {
          return await prisma.spendingCategory.findFirst({
            select: { id: true }
          })
        })
      }
    },
    {
      name: 'subcategories', 
      task: async () => {
        await withRetry(async () => {
          return await prisma.subCategory.findFirst({
            select: { id: true }
          })
        })
      }
    },
    {
      name: 'credit_cards',
      task: async () => {
        await withRetry(async () => {
          return await prisma.creditCard.findFirst({
            select: { id: true }
          })
        })
      }
    },
    {
      name: 'user_count',
      task: async () => {
        await withRetry(async () => {
          return await prisma.user.count()
        })
      }
    }
  ]
  
  for (const { name, task } of warmupTasks) {
    try {
      await task()
      operations.push(name)
    } catch (error: any) {
      console.error(`❌ Warmup task ${name} failed:`, error)
      errors.push(`${name}: ${error?.message || 'Unknown error'}`)
    }
  }
  
  return {
    success: errors.length === 0,
    operations,
    errors
  }
}

// Connection pool management for serverless
export async function ensureConnection(): Promise<boolean> {
  try {
    // Use simple operation instead of raw queries to avoid prepared statement conflicts
    await prisma.spendingCategory.count()
    return true
  } catch (error: any) {
    console.error('Connection check failed:', error)
    
    // If it's a prepared statement error, reset the client
    if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
      console.log('🔄 Prepared statement conflict in connection check, resetting client...')
      await resetPrismaClient()
      
      // Try again with the new client
      try {
        await prisma.spendingCategory.count()
        return true
      } catch (retryError) {
        console.error('Connection check failed after reset:', retryError)
        return false
      }
    }
    
    // Try to reconnect for other errors
    try {
      await disconnectPrisma()
      await new Promise(resolve => setTimeout(resolve, 100))
      await prisma.spendingCategory.count()
      return true
    } catch (reconnectError) {
      console.error('Reconnection failed:', reconnectError)
      return false
    }
  }
} 