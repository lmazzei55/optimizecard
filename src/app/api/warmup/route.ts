import { NextResponse } from 'next/server'
import { warmupDatabase, healthCheck } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('🔥 Starting API warmup...')
    
    // First, check basic health
    const health = await healthCheck()
    
    if (!health.healthy) {
      console.log('❌ Database unhealthy during warmup')
      return NextResponse.json({
        status: 'failed',
        reason: 'database_unhealthy',
        error: health.error,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
    
    // Perform database warmup
    const warmupResult = await warmupDatabase()
    
    const duration = Date.now() - startTime
    
    if (warmupResult.success) {
      console.log(`✅ API warmup completed successfully in ${duration}ms`)
      return NextResponse.json({
        status: 'success',
        operations: warmupResult.operations,
        duration,
        database_latency: health.latency,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log(`⚠️ API warmup partially failed in ${duration}ms`)
      return NextResponse.json({
        status: 'partial',
        operations: warmupResult.operations,
        errors: warmupResult.errors,
        duration,
        database_latency: health.latency,
        timestamp: new Date().toISOString()
      }, { status: 207 }) // Multi-status
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