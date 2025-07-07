import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client creation with serverless optimization
function createPrismaClient() {
  // Use DATABASE_URL as it works fine locally and in production
  const connectionUrl = process.env.DATABASE_URL
  
  console.log('🔄 Using DATABASE_URL for database connection')
  
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

// Create a pool of clients to avoid conflicts
class PrismaClientPool {
  private clients: PrismaClient[] = []
  private maxClients = 3
  private clientUsage = new WeakMap<PrismaClient, number>()

  async getClient(): Promise<PrismaClient> {
    // Clean up disconnected clients
    this.clients = this.clients.filter(client => {
      try {
        // Check if client is still connected by looking at internal state
        return (client as any)._engine && !(client as any)._engine._closed
      } catch {
        return false
      }
    })

    // Reuse existing client with lowest usage
    if (this.clients.length > 0) {
      const client = this.clients.reduce((least, current) => {
        const leastUsage = this.clientUsage.get(least) || 0
        const currentUsage = this.clientUsage.get(current) || 0
        return currentUsage < leastUsage ? current : least
      })
      
      this.clientUsage.set(client, (this.clientUsage.get(client) || 0) + 1)
      return client
    }

    // Create new client if under limit
    if (this.clients.length < this.maxClients) {
      const client = createPrismaClient()
      this.clients.push(client)
      this.clientUsage.set(client, 1)
      return client
    }

    // If at limit, use the least used client
    const client = this.clients[0]
    this.clientUsage.set(client, (this.clientUsage.get(client) || 0) + 1)
    return client
  }

  async resetClient(badClient: PrismaClient) {
    try {
      await badClient.$disconnect()
    } catch (e) {
      console.error('Error disconnecting bad client:', e)
    }
    
    this.clients = this.clients.filter(c => c !== badClient)
    this.clientUsage.delete(badClient)
  }

  async disconnectAll() {
    await Promise.all(this.clients.map(client => 
      client.$disconnect().catch(e => console.error('Error disconnecting client:', e))
    ))
    this.clients = []
  }
}

const clientPool = new PrismaClientPool()

// Export a getter that provides a client from the pool
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // For $disconnect, we need special handling
    if (prop === '$disconnect') {
      return async () => {
        console.log('Disconnect called on proxy - no op in pooled mode')
      }
    }
    
    // This is a simplified proxy - in production you'd want to properly handle async methods
    console.warn('Direct prisma access detected - use withRetry for better reliability')
    const client = globalForPrisma.prisma ?? createPrismaClient()
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = client
    }
    return Reflect.get(client, prop, receiver)
  }
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = globalForPrisma.prisma ?? createPrismaClient()
}

// Enhanced retry function with better error handling for serverless
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  // Get a client from the pool for this operation
  const client = await clientPool.getClient()
  
  // Replace the global prisma temporarily for this operation
  const originalPrisma = globalForPrisma.prisma
  globalForPrisma.prisma = client
  
  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Execute the operation with the pooled client
        const result = await operation()
        return result
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

        // NEW: If the error is a prepared statement conflict, reset this specific client
        if (shouldRetry && (
          error?.code === '42P05' ||
          error?.code === 'P2010' ||
          error?.message?.includes('prepared statement')
        )) {
          console.warn('🔄 Prepared statement conflict detected – removing client from pool')
          await clientPool.resetClient(client)
          
          // Get a fresh client for the retry
          if (!isLastAttempt) {
            const freshClient = await clientPool.getClient()
            globalForPrisma.prisma = freshClient
            console.log('✅ Got fresh client from pool for retry')
          }
        }

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
  } finally {
    // Restore the original prisma
    globalForPrisma.prisma = originalPrisma
  }
}

// Enhanced health check with better error reporting
export async function healthCheck(): Promise<{ healthy: boolean; error?: string; latency?: number }> {
  const start = Date.now()
  try {
    const client = await clientPool.getClient()
    // Use a simple query that doesn't require prepared statements
    await client.$executeRaw`SELECT 1`
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
    const client = await clientPool.getClient()
    
    // Test basic connectivity with executeRaw instead of queryRaw to avoid prepared statements
    await client.$executeRaw`SELECT 1`
    operations.push('connectivity')
    
    // Test table access with simple queries
    try {
      await client.spendingCategory.findFirst({ 
        select: { id: true },
        take: 1
      })
      operations.push('categories')
    } catch (error: any) {
      errors.push(`categories: ${error.message?.substring(0, 100)}`)
    }
    
    try {
      await client.creditCard.findFirst({ 
        select: { id: true },
        take: 1
      })
      operations.push('credit_cards')
    } catch (error: any) {
      errors.push(`credit_cards: ${error.message?.substring(0, 100)}`)
    }
    
    try {
      // Test user table access
      await client.user.findFirst({
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
if (typeof process !== 'undefined' && typeof process.on === 'function' && process.env.NEXT_RUNTIME !== 'edge') {
  process.on('beforeExit', async () => {
    await clientPool.disconnectAll()
  })
} 