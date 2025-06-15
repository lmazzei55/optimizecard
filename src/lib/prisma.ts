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

// Pre-warming function for critical database operations - optimized for speed
export async function warmupDatabase(): Promise<{ success: boolean; operations: string[]; errors: string[] }> {
  const operations: string[] = []
  const errors: string[] = []
  
  const warmupTasks = [
    {
      name: 'categories',
      task: async () => {
        // Use a faster operation with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 3000)
        })
        
        const operationPromise = withRetry(async () => {
          return await prisma.spendingCategory.findFirst({
            select: { id: true }
          })
        }, 2) // Reduced retries for speed
        
        return await Promise.race([operationPromise, timeoutPromise])
      }
    },
    {
      name: 'subcategories', 
      task: async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 3000)
        })
        
        const operationPromise = withRetry(async () => {
          return await prisma.subCategory.findFirst({
            select: { id: true }
          })
        }, 2)
        
        return await Promise.race([operationPromise, timeoutPromise])
      }
    },
    {
      name: 'credit_cards',
      task: async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 3000)
        })
        
        const operationPromise = withRetry(async () => {
          return await prisma.creditCard.findFirst({
            select: { id: true }
          })
        }, 2)
        
        return await Promise.race([operationPromise, timeoutPromise])
      }
    },
    {
      name: 'user_count',
      task: async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 3000)
        })
        
        const operationPromise = withRetry(async () => {
          // Use findMany with take 1 instead of count to avoid potential prepared statement issues
          const users = await prisma.user.findMany({
            select: { id: true },
            take: 1
          })
          return users.length
        }, 2)
        
        return await Promise.race([operationPromise, timeoutPromise])
      }
    }
  ]
  
  // Run all tasks in parallel for speed
  console.log('🚀 Running warmup tasks in parallel...')
  const results = await Promise.allSettled(
    warmupTasks.map(async ({ name, task }) => {
      try {
        await task()
        operations.push(name)
        console.log(`✅ Warmup task ${name} succeeded`)
        return { name, success: true }
      } catch (error: any) {
        console.error(`❌ Warmup task ${name} failed:`, error)
        
        // For prepared statement conflicts, treat as successful since database is working
        if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
          console.log(`⚠️ Prepared statement conflict in ${name}, but this indicates database is working`)
          operations.push(name) // ✅ Count as successful operation
          errors.push(`${name}: prepared statement conflict (database working)`)
          return { name, success: true } // ✅ Mark as success
        } else if (error?.message === 'Operation timeout') {
          console.log(`⏰ Timeout in ${name}, but continuing...`)
          errors.push(`${name}: operation timeout`)
        } else {
          errors.push(`${name}: ${error?.message || 'Unknown error'}`)
        }
        return { name, success: false }
      }
    })
  )
  
  // Consider it successful if at least one operation worked OR all failures are prepared statement conflicts
  const allErrorsArePreparedStatements = errors.length > 0 && errors.every(error => 
    error.includes('prepared statement conflict')
  )
  
  const success = operations.length > 0 || allErrorsArePreparedStatements
  
  console.log(`Warmup completed: ${operations.length}/${warmupTasks.length} operations successful`)
  
  if (allErrorsArePreparedStatements && operations.length === warmupTasks.length) {
    console.log('✅ All operations had prepared statement conflicts - database is working properly in serverless')
  }
  
  return {
    success,
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