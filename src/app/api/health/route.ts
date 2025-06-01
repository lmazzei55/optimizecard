import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRawUnsafe('SELECT 1')
    
    // Test if we can query basic data
    const categoryCount = await prisma.spendingCategory.count()
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      categories: categoryCount,
      users: userCount,
      timestamp: new Date().toISOString()
    })
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