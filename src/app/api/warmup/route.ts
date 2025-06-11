import { NextResponse } from 'next/server'
import { warmupDatabase } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('🔥 Starting API warmup...')
    
    // Set a reasonable timeout for the entire warmup process
    const WARMUP_TIMEOUT = 15000 // 15 seconds max
    
    const warmupPromise = warmupDatabase()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Warmup timeout')), WARMUP_TIMEOUT)
    })
    
    // Race between warmup and timeout
    const warmupResult = await Promise.race([warmupPromise, timeoutPromise]) as any
    
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
    
    // If it's a timeout, return a more specific error
    if (error.message === 'Warmup timeout') {
      return NextResponse.json({
        status: 'timeout',
        reason: 'warmup_timeout',
        error: 'Warmup operations took too long',
        duration,
        timestamp: new Date().toISOString()
      }, { status: 408 }) // Request Timeout
    }
    
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