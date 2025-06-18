import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma, withRetry } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Admin: Setting user to premium:', session.user.email)

    const updatedUser = await withRetry(async () => {
      return await prisma.user.upsert({
        where: { email: session.user.email! },
        update: { 
          subscriptionTier: 'premium',
          subscriptionStatus: 'active'
        },
        create: {
          email: session.user.email!,
          name: session.user.name,
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
          rewardPreference: 'points',
          pointValue: 0.01
        },
        select: {
          email: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          rewardPreference: true,
          pointValue: true,
          enableSubCategories: true
        }
      })
    })

    console.log('✅ User updated to premium:', updatedUser)

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error: any) {
    console.error('❌ Admin set-premium error:', error)
    return NextResponse.json(
      { error: 'Failed to set premium', details: error?.message },
      { status: 500 }
    )
  }
} 