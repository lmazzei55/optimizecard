import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Test database connection first
    await prisma.$queryRawUnsafe('SELECT 1')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { spendingData: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse spending data if it exists
    let spending = []
    if (user.spendingData) {
      try {
        spending = JSON.parse(user.spendingData)
      } catch (error) {
        console.error('Error parsing user spending data:', error)
      }
    }

    return NextResponse.json({ spending })
  } catch (error: any) {
    console.error('Error fetching user spending:', error)
    
    // If it's a database connection error, return a service unavailable error
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement')) {
      console.error('Database connection pool issue in spending API')
      return NextResponse.json(
        { error: 'Database temporarily unavailable', code: 'DB_POOL_ERROR' },
        { status: 503 }
      )
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { spending } = body

    if (!Array.isArray(spending)) {
      return NextResponse.json({ error: 'Invalid spending data' }, { status: 400 })
    }

    // Update user's spending data
    await prisma.user.update({
      where: { email: session.user.email },
      data: { spendingData: JSON.stringify(spending) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving user spending:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 