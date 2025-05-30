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

    // Get user's owned cards to exclude from recommendations
    let ownedCardIds: string[] = []
    try {
      const session = await auth()
      if (session?.user?.id) {
        const ownedCards = await prisma.userCard.findMany({
          where: { userId: session.user.id },
          select: { cardId: true }
        })
        ownedCardIds = ownedCards.map(uc => uc.cardId)
      }
    } catch (error) {
      console.error('Error fetching owned cards:', error)
      // Continue without excluding cards if there's an error
    }

    // Calculate recommendations
    const recommendations = await calculateCardRecommendations({
      userSpending,
      rewardPreference,
      pointValue: pointValue || 0.01,
      benefitValuations: benefitValuations || [],
      cardCustomizations: cardCustomizations || {},
      ownedCardIds
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