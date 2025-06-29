import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with safe configuration
function createPrismaClient() {
  // Use the pooled DATABASE_URL instead of DIRECT_DATABASE_URL for better stability
  const databaseUrl = process.env.DATABASE_URL
  const config: any = {
    log: ['query'],
    // Add unique client identifier to avoid prepared statement conflicts
    __internal: {
      engine: {
        enableDebugLogs: false,
      },
    },
  }

  // Only add datasources if databaseUrl is defined
  if (databaseUrl) {
    config.datasources = {
      db: { url: databaseUrl },
    }
  }

  return new PrismaClient(config)
}

export let prisma = globalForPrisma.prisma ?? createPrismaClient()

// Add connection pool management for serverless - only in Node.js runtime (not Edge Runtime)
// Skip entirely in browser or Edge Runtime environments
if (typeof window === 'undefined' && 
    process.env.NODE_ENV === 'production' && 
    typeof process !== 'undefined' && 
    typeof process.on === 'function' && 
    !process.env.NEXT_RUNTIME && 
    !process.env.EDGE_RUNTIME &&
    process.env.VERCEL_ENV !== 'edge') {
  try {
    // Only use process.on if we're definitely in Node.js runtime
    if (typeof process.on === 'function') {
      // Disconnect after each serverless function execution
      process.on('beforeExit', async () => {
        try {
          await prisma.$disconnect()
        } catch (error) {
          // Ignore disconnect errors in serverless
        }
      })
    }
    
    // CRITICAL: Enhanced Prisma client for better stability
    prisma = createPrismaClient()
  } catch (error) {
    console.warn('⚠️ Could not set up serverless connection management:', error)
  }
}

// Enhanced retry wrapper with better error categorization
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries
      
      // Check for specific error types that warrant retry including prepared statement conflicts
      const shouldRetry = 
        error?.code === 'P1001' || // Database unreachable
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P1017' || // Connection closed
        error?.code === 'P2024' || // Timed out fetching a new connection
        error?.code === '42P05' || // Prepared statement conflicts
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('already exists') ||
        error?.message?.includes('Connection terminated') ||
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('Connection lost')

      if (!shouldRetry || isLastAttempt) {
        // For prepared statement conflicts, try to recreate the client
        if ((error?.code === '42P05' || error?.message?.includes('prepared statement')) && !isLastAttempt) {
          console.log(`🔄 Prepared statement conflict detected, recreating Prisma client (attempt ${attempt}/${maxRetries})`)
          try {
            await prisma.$disconnect()
            prisma = createPrismaClient()
            if (process.env.NODE_ENV !== 'production') {
              globalForPrisma.prisma = prisma
            }
            // Continue to next retry iteration
            continue
          } catch (resetError) {
            console.warn('⚠️ Failed to reset Prisma client:', resetError)
          }
        }
        
        throw error
      }

      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      console.log(`⚠️ Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`, {
        error: error?.message || error,
        code: error?.code
      })
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Max retries exceeded')
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
      globalForPrisma.prisma = prisma
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