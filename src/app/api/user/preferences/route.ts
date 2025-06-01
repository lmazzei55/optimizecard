import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          rewardPreference: true,
          pointValue: true,
          enableSubCategories: true
        }
      })
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`✅ Preferences API: Retrieved for user`)

    return NextResponse.json({
      rewardPreference: user.rewardPreference,
      pointValue: user.pointValue,
      enableSubCategories: user.enableSubCategories
    })

  } catch (error: any) {
    console.error('❌ Preferences API Error:', error)
    
    // Return 503 for database connection issues with fallback preferences
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      console.error('Database connection pool issue detected')
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          rewardPreference: 'CASHBACK',  // Default fallback
          pointValue: 0.01,
          enableSubCategories: false
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rewardPreference, pointValue, enableSubCategories } = await request.json()

    const updatedUser = await withRetry(async () => {
      return await prisma.user.update({
        where: { email: session.user.email! },
        data: {
          rewardPreference,
          pointValue,
          enableSubCategories
        },
        select: {
          rewardPreference: true,
          pointValue: true,
          enableSubCategories: true
        }
      })
    })

    console.log(`✅ Preferences updated for user`)

    return NextResponse.json({
      success: true,
      data: updatedUser
    })

  } catch (error: any) {
    console.error('❌ Preferences Update Error:', error)
    
    // Return 503 for database connection issues
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 