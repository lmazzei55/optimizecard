import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client creation with serverless optimization
function createPrismaClient() {
  // CRITICAL: Use direct database connection to avoid pooling conflicts
  // Prioritize DIRECT_URL over DATABASE_URL for serverless environments
  let connectionUrl = process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
  
  // Log which connection type we're using
  if (process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL) {
    console.log('🔄 Using DIRECT database connection to avoid pooling conflicts')
  } else if (process.env.DATABASE_URL?.includes('pooler')) {
    console.log('⚠️ Warning: Using pooled connection - may cause prepared statement conflicts')
  } else {
    console.log('🔄 Using standard database connection')
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: {
      db: {
        url: connectionUrl
      }
    },
    // Configure for serverless environments
    transactionOptions: {
      timeout: 10000, // 10 second timeout
      maxWait: 5000,  // 5 second max wait
      isolationLevel: 'ReadCommitted'
    }
  })
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Enhanced retry function with better error handling for serverless
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
      
      // Retry for connection issues and prepared statement conflicts
      const shouldRetry = 
        error?.code === 'P1001' || // Database unreachable
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P2024' || // Timed out fetching connection
        error?.code === 'P2010' || // Raw query failed (prepared statement conflicts)
        error?.code === 'P1017' || // Server has closed the connection
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('Connection terminated') ||
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('already exists') ||
        error?.message?.includes('connection closed') ||
        error?.message?.includes('connection reset')

      if (!shouldRetry || isLastAttempt) {
        console.error(`❌ Database operation failed (attempt ${attempt}/${maxRetries}):`, {
          code: error?.code,
          message: error?.message?.substring(0, 200),
          shouldRetry,
          isLastAttempt
        })
        throw error
      }

      const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
      console.log(`⚠️ Retrying database operation (${attempt}/${maxRetries}) in ${delay}ms - Error: ${error?.code || error?.message?.substring(0, 50)}`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Enhanced health check with better error reporting
export async function healthCheck(): Promise<{ healthy: boolean; error?: string; latency?: number }> {
  const start = Date.now()
  try {
    // Use a simple query that doesn't require prepared statements
    await prisma.$executeRaw`SELECT 1`
    const latency = Date.now() - start
    return { healthy: true, latency }
  } catch (error: any) {
    const latency = Date.now() - start
    return { 
      healthy: false, 
      error: error?.message || 'Unknown error',
      latency
    }
  }
}

// Enhanced warmup for serverless with better error handling
export async function warmupDatabase(): Promise<{ success: boolean; operations: string[]; errors?: string[] }> {
  const operations: string[] = []
  const errors: string[] = []
  
  try {
    // Test basic connectivity with executeRaw instead of queryRaw to avoid prepared statements
    await prisma.$executeRaw`SELECT 1`
    operations.push('connectivity')
    
    // Test table access with simple queries
    try {
      await prisma.spendingCategory.findFirst({ 
        select: { id: true },
        take: 1
      })
      operations.push('categories')
    } catch (error: any) {
      errors.push(`categories: ${error.message?.substring(0, 100)}`)
    }
    
    try {
      await prisma.creditCard.findFirst({ 
        select: { id: true },
        take: 1
      })
      operations.push('credit_cards')
    } catch (error: any) {
      errors.push(`credit_cards: ${error.message?.substring(0, 100)}`)
    }
    
    try {
      // Test user table access
      await prisma.user.findFirst({
        select: { id: true },
        take: 1
      })
      operations.push('users')
    } catch (error: any) {
      errors.push(`users: ${error.message?.substring(0, 100)}`)
    }
    
    return { 
      success: operations.length > 0, 
      operations,
      ...(errors.length > 0 && { errors })
    }
  } catch (error: any) {
    console.error('Database warmup failed:', error)
    return { 
      success: false, 
      operations,
      errors: [error?.message?.substring(0, 100) || 'Unknown warmup error']
    }
  }
}

// Force disconnect on process termination to clean up connections
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
} 