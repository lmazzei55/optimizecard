import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rewardPreference, pointValue, enableSubCategories } = body

    // Validate input
    if (!rewardPreference || typeof pointValue !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Test database connection first
    await prisma.$queryRawUnsafe('SELECT 1')

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        rewardPreference,
        pointValue,
        enableSubCategories: Boolean(enableSubCategories),
      },
    })

    return NextResponse.json({ 
      success: true,
      user: {
        rewardPreference: updatedUser.rewardPreference,
        pointValue: updatedUser.pointValue,
        enableSubCategories: updatedUser.enableSubCategories,
      }
    })
  } catch (error: any) {
    console.error('Error updating user preferences:', error)
    
    // If it's a database connection error, return a service unavailable error
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement')) {
      console.error('Database connection pool issue in preferences API')
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