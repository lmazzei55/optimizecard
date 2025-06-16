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
      subscriptionTier,
      pointValue,
      cardCustomizations: Object.keys(cardCustomizations).length > 0 ? 'Yes' : 'No'
    })

    // Validate input
    if (!userSpending || userSpending.length === 0) {
      console.log('❌ No user spending provided')
      return NextResponse.json([])
    }

    // Filter out zero spending
    const activeSpending = userSpending.filter(s => s.monthlySpend > 0)
    if (activeSpending.length === 0) {
      console.log('❌ No active spending (all zero amounts)')
      return NextResponse.json([])
    }

    console.log('✅ Active spending:', activeSpending)

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
      // Free tier users can only see cashback cards, premium users see all cards
      tier: userSubscriptionTier === 'free' ? 'free' : undefined,
      isActive: true
    })

    console.log(`📋 Found ${cards.length} cards via direct connection`)
    console.log('🃏 Card names:', cards.map(c => c.name))

    if (cards.length === 0) {
      console.log('❌ No cards found matching criteria')
      return NextResponse.json([])
    }

    // Additional filtering for free tier users requesting points cards
    let availableCards = cards
    if (userSubscriptionTier === 'free' && rewardPreference === 'points') {
      console.log('🚫 Free tier user requesting points cards - returning empty results')
      return NextResponse.json([])
    }

    // Filter out owned cards
    availableCards = ownedCardIds.length > 0 
      ? availableCards.filter(card => !ownedCardIds.includes(card.id))
      : availableCards

    console.log(`🎯 Available cards after filtering owned: ${availableCards.length}`)

    const recommendations: CardRecommendation[] = []

    // Process each card
    for (const card of availableCards) {
      try {
        console.log(`\n🔍 Processing card: ${card.name}`)
        
        // Get category rewards and benefits in parallel
        const [categoryRewards, benefits] = await Promise.all([
          getCategoryRewards(card.id),
          getCardBenefits(card.id)
        ])

        console.log(`  📊 Found ${categoryRewards.length} category rewards, ${benefits.length} benefits`)

        // Calculate value for user spending
        let totalAnnualValue = 0
        const categoryBreakdown = []

        for (const spending of activeSpending) {
          // Find best matching reward rate
          let bestRewardRate = card.baseReward
          
          for (const reward of categoryRewards) {
            if (reward.categoryName === spending.categoryName) {
              console.log(`  🎯 Found matching reward: ${reward.categoryName} at ${reward.rewardRate}`)
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
            // Use card-specific point value if customized
            const cardCustomization = cardCustomizations[card.id]
            const effectivePointValue = cardCustomization?.pointValue || pointValue
            monthlyValue = monthlyValue * effectivePointValue
          }

          const annualValue = monthlyValue * 12
          totalAnnualValue += annualValue

          console.log(`  💰 ${spending.categoryName}: $${spending.monthlySpend}/mo × ${bestRewardRate} = $${monthlyValue.toFixed(2)}/mo`)

          categoryBreakdown.push({
            categoryName: spending.categoryName,
            monthlySpend: spending.monthlySpend,
            rewardRate: bestRewardRate,
            monthlyValue: monthlyValue,
            annualValue: annualValue
          })
        }

        // Calculate benefits value with customizations
        let benefitsValue = 0
        const benefitsBreakdown = []
        
        // Get card-specific customizations
        const cardCustomization = cardCustomizations[card.id]
        
        for (const benefit of benefits) {
          let personalValue = 0
          
          // Check if we have customizations for this card
          if (cardCustomization?.benefitValues && cardCustomization?.enabledBenefits) {
            // Use new format: benefit is enabled and has custom value
            const isEnabled = cardCustomization.enabledBenefits[benefit.name] !== false // Default to enabled
            if (isEnabled) {
              personalValue = cardCustomization.benefitValues[benefit.name] || benefit.annualValue || 0
            }
            // If not enabled, personalValue stays 0
            console.log(`  🎁 ${benefit.name}: ${isEnabled ? 'enabled' : 'disabled'}, value: $${personalValue}`)
          } else {
            // Default case: use official benefit value when no customizations exist
            personalValue = benefit.annualValue || 0
          }
          
          benefitsValue += personalValue
          
          benefitsBreakdown.push({
            benefitName: benefit.name,
            officialValue: benefit.annualValue || 0,
            personalValue,
            category: benefit.category
          })
        }
        
        const netAnnualValue = totalAnnualValue + benefitsValue - card.annualFee

        console.log(`  📈 Total annual value: $${totalAnnualValue.toFixed(2)}, Benefits: $${benefitsValue.toFixed(2)}, Net: $${netAnnualValue.toFixed(2)}`)

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
          benefitsBreakdown,
          signupBonus: card.signupBonus ? {
            amount: card.signupBonus,
            requiredSpend: card.signupSpend || 0,
            timeframe: card.signupTimeframe || 3
          } : undefined
        }

        recommendations.push(recommendation)
        console.log(`  ✅ Added recommendation for ${card.name}`)

      } catch (error) {
        console.error(`❌ Error processing card ${card.name}:`, error)
        continue
      }
    }

    console.log(`\n🎉 Generated ${recommendations.length} recommendations`)

    // Sort by net annual value (descending)
    recommendations.sort((a, b) => b.netAnnualValue - a.netAnnualValue)

    // Return top 10 recommendations
    const topRecommendations = recommendations.slice(0, 10)
    console.log('🏆 Top recommendations:', topRecommendations.map(r => `${r.cardName}: $${r.netAnnualValue.toFixed(2)}`))

    return NextResponse.json(topRecommendations)

  } catch (error) {
    console.error('❌ Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
} 