import { NextResponse } from 'next/server'
import { warmupDatabase } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('🔥 Starting API warmup...')
    
    // Skip health check and go directly to warmup operations
    // The warmup operations themselves will test database connectivity
    const warmupResult = await warmupDatabase()
    
    const duration = Date.now() - startTime
    
    if (warmupResult.success) {
      console.log(`✅ API warmup completed successfully in ${duration}ms`)
      return NextResponse.json({
        status: 'success',
        operations: warmupResult.operations,
        duration,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log(`⚠️ API warmup partially failed in ${duration}ms`)
      
      // If we have some successful operations, it's a partial success
      if (warmupResult.operations.length > 0) {
        return NextResponse.json({
          status: 'partial',
          operations: warmupResult.operations,
          errors: warmupResult.errors,
          duration,
          timestamp: new Date().toISOString()
        }, { status: 207 }) // Multi-status
      } else {
        // If no operations succeeded, it's a failure
        return NextResponse.json({
          status: 'failed',
          reason: 'all_operations_failed',
          errors: warmupResult.errors,
          duration,
          timestamp: new Date().toISOString()
        }, { status: 503 })
      }
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('❌ API warmup failed:', error)
    
    return NextResponse.json({
      status: 'failed',
      reason: 'warmup_error',
      error: error?.message || 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also support POST for manual triggering
export const POST = GET 