import { NextRequest, NextResponse } from 'next/server'
import { calculateMultiCardStrategies } from '@/lib/multi-card-engine'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userSpending, benefitValuations, rewardPreference } = body

    if (!userSpending || !Array.isArray(userSpending)) {
      return NextResponse.json(
        { error: 'Invalid user spending data' },
        { status: 400 }
      )
    }

    // Get user and check subscription
    let userSubscriptionTier = 'free'
    try {
      const session = await auth()
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { subscriptionTier: true }
        })
        
        if (user) {
          userSubscriptionTier = user.subscriptionTier
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }

    // Only allow premium users to access multi-card strategies
    if (userSubscriptionTier !== 'premium') {
      return NextResponse.json({ 
        error: 'Premium subscription required',
        message: 'Multi-card strategies are available for Premium subscribers only.'
      }, { status: 403 })
    }

    // Calculate multi-card strategies
    const strategies = await calculateMultiCardStrategies({
      userSpending,
      rewardPreference: rewardPreference || 'best_overall',
      benefitValuations: benefitValuations || [],
      subscriptionTier: userSubscriptionTier
    })

    return NextResponse.json({ strategies })

  } catch (error) {
    console.error('Error generating multi-card strategies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 