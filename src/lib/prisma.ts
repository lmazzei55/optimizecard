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
  // Enhanced settings for serverless cold starts
  ...(process.env.NODE_ENV === 'production' && {
    transactionOptions: {
      timeout: 30000, // 30 seconds for cold starts
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
         error?.message?.includes('timeout') ||
         error?.message?.includes('connection') ||
         error?.message?.includes('ECONNRESET') ||
         error?.message?.includes('ETIMEDOUT')) && 
        attempt < maxRetries
      )
      
      if (isRetryable) {
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

// Pre-warming function for critical database operations
export async function warmupDatabase(): Promise<{ success: boolean; operations: string[]; errors: string[] }> {
  const operations: string[] = []
  const errors: string[] = []
  
  const warmupTasks = [
    {
      name: 'categories',
      task: async () => {
        await prisma.spendingCategory.findFirst()
      }
    },
    {
      name: 'subcategories', 
      task: async () => {
        await prisma.subCategory.findFirst()
      }
    },
    {
      name: 'credit_cards',
      task: async () => {
        await prisma.creditCard.findFirst()
      }
    },
    {
      name: 'user_count',
      task: async () => {
        await prisma.user.count()
      }
    }
  ]
  
  for (const { name, task } of warmupTasks) {
    try {
      // Simple retry logic for warmup (no complex typing needed)
      let lastError: any
      let success = false
      
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await task()
          success = true
          break
        } catch (error: any) {
          lastError = error
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }
      
      if (success) {
        operations.push(name)
      } else {
        throw lastError
      }
    } catch (error: any) {
      errors.push(`${name}: ${error?.message || 'Unknown error'}`)
    }
  }
  
  return {
    success: errors.length === 0,
    operations,
    errors
  }
} 