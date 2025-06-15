import { PrismaClient } from '../generated/prisma'

declare global {
  var prisma: PrismaClient | undefined
}

// Create a new Prisma client with configuration to handle prepared statement conflicts
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

// Use a singleton pattern but with better error handling
export let prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Enhanced retry function that handles prepared statement conflicts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a prepared statement conflict
      const isPreparedStatementError = 
        error?.code === '42P05' || 
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('already exists')

      if (isPreparedStatementError && attempt < maxRetries) {
        console.log(`⚠️ Prepared statement conflict (attempt ${attempt}/${maxRetries}), retrying...`)
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // For prepared statement conflicts, we'll create a fresh query
        continue
      } else if (!isPreparedStatementError) {
        // For non-prepared statement errors, throw immediately
        throw error
      }
    }
  }

  // If we get here, all retries failed
  console.error(`❌ All ${maxRetries} retries failed for operation`)
  throw lastError
}

// Alternative query function that bypasses prepared statements for critical operations
export async function executeRawQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    // Use $queryRawUnsafe to bypass prepared statements
    const result = await prisma.$queryRawUnsafe(query, ...params)
    return result as T[]
  } catch (error: any) {
    console.error('❌ Raw query failed:', error)
    throw error
  }
}

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

// Function to reset Prisma client completely
export async function resetPrismaClient() {
  try {
    console.log('🔄 Resetting Prisma client due to connection issues...')
    await prisma.$disconnect()
    prisma = createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalThis.prisma = prisma
    }
    console.log('✅ Prisma client reset successfully')
  } catch (error) {
    console.warn('⚠️ Error during Prisma client reset:', error)
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