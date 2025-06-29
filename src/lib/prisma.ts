import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Simplified Prisma client creation
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Simplified retry function for critical operations only
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 500
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries
      
      // Only retry for genuine connection issues
      const shouldRetry = 
        error?.code === 'P1001' || // Database unreachable
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P2024' || // Timed out fetching connection
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('Connection terminated')

      if (!shouldRetry || isLastAttempt) {
        throw error
      }

      const delay = baseDelay * attempt
      console.log(`⚠️ Retrying database operation (${attempt}/${maxRetries}) in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Simple health check
export async function healthCheck(): Promise<{ healthy: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { healthy: true }
  } catch (error: any) {
    return { healthy: false, error: error?.message || 'Unknown error' }
  }
}

// Simplified warmup for serverless
export async function warmupDatabase(): Promise<{ success: boolean; operations: string[] }> {
  const operations: string[] = []
  
  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`
    operations.push('connectivity')
    
    // Test table access
    await prisma.spendingCategory.findFirst({ select: { id: true } })
    operations.push('categories')
    
    await prisma.creditCard.findFirst({ select: { id: true } })
    operations.push('credit_cards')
    
    return { success: true, operations }
  } catch (error) {
    console.error('Database warmup failed:', error)
    return { success: false, operations }
  }
} 