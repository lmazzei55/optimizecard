import { NextResponse } from 'next/server'
import { healthCheck } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Quick health check
    const health = await healthCheck()
    
    if (!health.healthy) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        error: health.error,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // If healthy, get some basic counts
    try {
      const [categoryCount, userCount, cardCount] = await Promise.all([
        prisma.spendingCategory.count(),
        prisma.user.count(),
        prisma.creditCard.count()
      ])

      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        latency: `${health.latency}ms`,
        categories: categoryCount,
        users: userCount,
        cards: cardCount,
        timestamp: new Date().toISOString()
      })
    } catch (countError) {
      // Even if counts fail, we know the connection works
      return NextResponse.json({
        status: 'partially_healthy',
        database: 'connected',
        latency: `${health.latency}ms`,
        note: 'Connection works but some queries failing',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error?.message || 'Unknown error',
      code: error?.code,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
} 