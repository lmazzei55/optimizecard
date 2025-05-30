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
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 