import { NextRequest, NextResponse } from 'next/server'
import { 
  getCreditCardsWithRewards, 
  getCategoryRewards, 
  getCardBenefits 
} from '@/lib/direct-db'
import { auth } from '@/lib/auth'
import { prisma, withRetry } from '@/lib/prisma'

interface UserSpending {
  categoryName: string
  monthlySpend: number
}

interface CardRecommendation {
  cardId: string
  cardName: string
  issuer: string
  annualFee: number
  rewardType: string
  applicationUrl?: string
  totalAnnualValue: number
  benefitsValue: number
  netAnnualValue: number
  categoryBreakdown: {
    categoryName: string
    monthlySpend: number
    rewardRate: number
    monthlyValue: number
    annualValue: number
  }[]
  benefitsBreakdown: {
    benefitName: string
    officialValue: number
    personalValue: number
    category: string
  }[]
  signupBonus?: {
    amount: number
    requiredSpend: number
    timeframe: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userSpending, 
      rewardPreference = 'cashback', 
      pointValue = 0.01,
      benefitValuations = [],
      cardCustomizations = {},
      ownedCardIds = [],
      subscriptionTier = 'free'
    }: {
      userSpending: UserSpending[]
      rewardPreference: 'cashback' | 'points' | 'best_overall'
      pointValue?: number
      benefitValuations?: any[]
      cardCustomizations?: any
      ownedCardIds?: string[]
      subscriptionTier?: 'free' | 'premium'
    } = body

    console.log('🎯 Recommendations with:', { 
      userSpending: userSpending?.length, 
      rewardPreference, 
      subscriptionTier 
    })

    // Validate input
    if (!userSpending || userSpending.length === 0) {
      return NextResponse.json([])
    }

    // Filter out zero spending
    const activeSpending = userSpending.filter(s => s.monthlySpend > 0)
    if (activeSpending.length === 0) {
      return NextResponse.json([])
    }

    // Get user session for subscription tier
    let userSubscriptionTier = subscriptionTier
    try {
      const session = await auth()
      if (session?.user?.email) {
        const user = await withRetry(async () => {
          return await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { subscriptionTier: true }
          })
        })
        if (user) {
          userSubscriptionTier = user.subscriptionTier as 'free' | 'premium'
        }
      }
    } catch (error) {
      console.log('⚠️ Could not get user subscription tier, using default:', subscriptionTier)
    }

    // Get cards using direct database connection
    const cards = await getCreditCardsWithRewards({
      rewardType: rewardPreference === 'best_overall' ? undefined : rewardPreference,
      tier: userSubscriptionTier === 'free' ? 'free' : undefined,
      isActive: true
    })

    console.log(`📋 Found ${cards.length} cards via direct connection`)

    if (cards.length === 0) {
      return NextResponse.json([])
    }

    // Filter out owned cards
    const availableCards = ownedCardIds.length > 0 
      ? cards.filter(card => !ownedCardIds.includes(card.id))
      : cards

    const recommendations: CardRecommendation[] = []

    // Process each card
    for (const card of availableCards) {
      try {
        // Get category rewards and benefits in parallel
        const [categoryRewards, benefits] = await Promise.all([
          getCategoryRewards(card.id),
          getCardBenefits(card.id)
        ])

        // Calculate value for user spending
        let totalAnnualValue = 0
        const categoryBreakdown = []

        for (const spending of activeSpending) {
          // Find best matching reward rate
          let bestRewardRate = card.baseReward
          
          for (const reward of categoryRewards) {
            if (reward.categoryName === spending.categoryName) {
              // Handle spending caps if they exist
              if (reward.maxReward && reward.period) {
                const periodMultiplier = reward.period === 'monthly' ? 1 : 
                                       reward.period === 'quarterly' ? 3 : 12
                const maxSpendingPerMonth = reward.maxReward / (reward.rewardRate * periodMultiplier)
                
                if (spending.monthlySpend <= maxSpendingPerMonth) {
                  bestRewardRate = Math.max(bestRewardRate, reward.rewardRate)
                } else {
                  // Tiered calculation: bonus rate up to cap, base rate for overage
                  const cappedValue = maxSpendingPerMonth * reward.rewardRate
                  const overageValue = (spending.monthlySpend - maxSpendingPerMonth) * card.baseReward
                  bestRewardRate = (cappedValue + overageValue) / spending.monthlySpend
                }
              } else {
                bestRewardRate = Math.max(bestRewardRate, reward.rewardRate)
              }
            }
          }

          // For points cards, apply point value
          let monthlyValue = spending.monthlySpend * bestRewardRate
          if (card.rewardType === 'points') {
            monthlyValue = monthlyValue * pointValue
          }

          const annualValue = monthlyValue * 12
          totalAnnualValue += annualValue

          categoryBreakdown.push({
            categoryName: spending.categoryName,
            monthlySpend: spending.monthlySpend,
            rewardRate: bestRewardRate,
            monthlyValue: monthlyValue,
            annualValue: annualValue
          })
        }

        // Calculate benefits value
        const benefitsValue = benefits.reduce((sum: number, benefit: any) => 
          sum + (benefit.annualValue || 0), 0)
        
        const netAnnualValue = totalAnnualValue + benefitsValue - card.annualFee

        // Create recommendation object
        const recommendation: CardRecommendation = {
          cardId: card.id,
          cardName: card.name,
          issuer: card.issuer,
          annualFee: card.annualFee,
          rewardType: card.rewardType,
          applicationUrl: card.applicationUrl,
          totalAnnualValue,
          benefitsValue,
          netAnnualValue,
          categoryBreakdown,
          benefitsBreakdown: benefits.map((benefit: any) => ({
            benefitName: benefit.name,
            officialValue: benefit.annualValue || 0,
            personalValue: benefit.annualValue || 0,
            category: benefit.category
          }))
        }

        // Add signup bonus if available
        if (card.signupBonus && card.signupSpend && card.signupTimeframe) {
          recommendation.signupBonus = {
            amount: card.signupBonus,
            requiredSpend: card.signupSpend,
            timeframe: card.signupTimeframe
          }
        }

        recommendations.push(recommendation)

      } catch (cardError: any) {
        console.log(`⚠️ Error processing ${card.name}:`, cardError.message)
        // Continue with other cards
      }
    }

    // Sort by net annual value (highest first)
    recommendations.sort((a, b) => b.netAnnualValue - a.netAnnualValue)

    console.log(`🎉 Returning ${recommendations.length} recommendations`)

    return NextResponse.json(recommendations)

  } catch (error: any) {
    console.error('❌ Recommendations error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to calculate recommendations', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 