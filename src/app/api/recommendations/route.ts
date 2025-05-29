import { NextRequest, NextResponse } from 'next/server'
import { calculateCardRecommendations } from '@/lib/recommendation-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userSpending, rewardPreference, pointValue } = body

    // Validate input
    if (!userSpending || !Array.isArray(userSpending)) {
      return NextResponse.json(
        { error: 'Invalid user spending data' },
        { status: 400 }
      )
    }

    if (!rewardPreference || !['cashback', 'points'].includes(rewardPreference)) {
      return NextResponse.json(
        { error: 'Invalid reward preference' },
        { status: 400 }
      )
    }

    // Calculate recommendations
    const recommendations = await calculateCardRecommendations({
      userSpending,
      rewardPreference,
      pointValue: pointValue || 0.01
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