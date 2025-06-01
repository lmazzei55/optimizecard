import { NextRequest, NextResponse } from 'next/server'
import { calculateCardRecommendations } from '@/lib/recommendation-engine'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userSpending, rewardPreference, pointValue, benefitValuations, cardCustomizations } = body

    // Validate input
    if (!userSpending || !Array.isArray(userSpending)) {
      return NextResponse.json(
        { error: 'Invalid user spending data' },
        { status: 400 }
      )
    }

    if (!rewardPreference || !['cashback', 'points', 'best_overall'].includes(rewardPreference)) {
      return NextResponse.json(
        { error: 'Invalid reward preference' },
        { status: 400 }
      )
    }

    // Validate benefit valuations if provided
    if (benefitValuations && !Array.isArray(benefitValuations)) {
      return NextResponse.json(
        { error: 'Invalid benefit valuations data' },
        { status: 400 }
      )
    }

    // Validate card customizations if provided
    if (cardCustomizations && typeof cardCustomizations !== 'object') {
      return NextResponse.json(
        { error: 'Invalid card customizations data' },
        { status: 400 }
      )
    }

    // Get user's owned cards and subscription tier
    let ownedCardIds: string[] = []
    let userSubscriptionTier: 'free' | 'premium' = 'free' // Default to free tier
    
    try {
      const session = await auth()
      if (session?.user?.email) {
        // Get user data including subscription tier and owned cards
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            subscriptionTier: true,
            ownedCards: {
              select: { cardId: true }
            }
          }
        })
        
        if (user) {
          userSubscriptionTier = (user.subscriptionTier as 'free' | 'premium') || 'free'
          ownedCardIds = user.ownedCards.map((uc: { cardId: string }) => uc.cardId)
          console.log(`✅ Recommendations API: User ${session.user.email} has ${userSubscriptionTier} tier`)
        }
      } else {
        console.log('ℹ️ Recommendations API: No session found, using free tier defaults')
      }
    } catch (error: any) {
      console.error('⚠️ Recommendations API: Error fetching user data:', error.message)
      // Continue with default free tier if there's an error
      // Don't let authentication errors break the recommendations
    }

    // Calculate recommendations with subscription tier filtering
    const recommendations = await calculateCardRecommendations({
      userSpending,
      rewardPreference,
      pointValue: pointValue || 0.01,
      benefitValuations: benefitValuations || [],
      cardCustomizations: cardCustomizations || {},
      ownedCardIds,
      subscriptionTier: userSubscriptionTier
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error calculating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to calculate recommendations' },
      { status: 500 }
    )
  }
} 