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
      subscriptionTier = 'free',
      calculationPreferences = {
        includeAnnualFees: true,
        includeBenefits: true,
        includeSignupBonuses: true,
        calculationMode: 'comprehensive'
      }
    }: {
      userSpending: UserSpending[]
      rewardPreference: 'cashback' | 'points' | 'best_overall'
      pointValue?: number
      benefitValuations?: any[]
      cardCustomizations?: any
      ownedCardIds?: string[]
      subscriptionTier?: 'free' | 'premium'
      calculationPreferences?: {
        includeAnnualFees: boolean
        includeBenefits: boolean
        includeSignupBonuses: boolean
        calculationMode: 'rewards_only' | 'comprehensive' | 'net_value'
      }
    } = body

    console.log('🎯 Recommendations with:', { 
      userSpending: userSpending?.length, 
      rewardPreference, 
      subscriptionTier,
      pointValue,
      cardCustomizations: Object.keys(cardCustomizations).length > 0 ? 'Yes' : 'No',
      cardCustomizationKeys: Object.keys(cardCustomizations),
      ownedCardIds: ownedCardIds?.length || 0,
      calculationPreferences
    })
    
    // Log detailed customizations for debugging
    if (Object.keys(cardCustomizations).length > 0) {
      console.log('🔧 Detailed card customizations:', JSON.stringify(cardCustomizations, null, 2))
    }

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
    let sessionUserEmail = null
    try {
      const session = await auth()
      sessionUserEmail = session?.user?.email
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
      console.log('🔍 User subscription tier check:', {
        sessionExists: !!session?.user?.email,
        userEmail: sessionUserEmail,
        originalTier: subscriptionTier,
        dbTier: userSubscriptionTier,
        rewardPreference,
        isAuthenticated: !!session?.user?.email
      })
    } catch (error) {
      console.log('⚠️ Could not get user subscription tier, using default:', subscriptionTier, 'Error:', error)
    }

    // Get cards using direct database connection
    const cards = await getCreditCardsWithRewards({
      rewardType: rewardPreference === 'best_overall' ? undefined : rewardPreference,
      // Only apply tier filtering if user specifically requests cashback only
      // For best_overall, show all cards regardless of tier to give full recommendations
      tier: (userSubscriptionTier === 'free' && rewardPreference === 'cashback') ? 'free' : undefined,
      isActive: true
    })

    console.log(`📋 Found ${cards.length} cards via direct connection`)
    console.log('🃏 Card names:', cards.map(c => c.name))

    if (cards.length === 0) {
      console.log('❌ No cards found matching criteria')
      return NextResponse.json([])
    }

    // Filter cards based on subscription tier - but don't return empty, just filter the list
    let availableCards = cards
    // Note: Subscription tier filtering is already handled in the database query above
    // The tier filtering in getCreditCardsWithRewards() ensures free users only see free tier cards
    // No additional filtering needed here to avoid incorrectly removing points cards
    
    console.log(`🎯 Available cards after tier filtering: ${availableCards.length}`)

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
            if (reward.categoryName === spending.categoryName || reward.subCategoryName === spending.categoryName) {
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
          let monthlyValue: number

          if (card.rewardType === 'points') {
            // Points cards may store rewardRate either as a monetary equivalent (<1) or as points-per-dollar (>=1)
            const cardCustomization = cardCustomizations[card.id]
            const effectivePointValue = cardCustomization?.pointValue || pointValue

            if (bestRewardRate < 1) {
              // rewardRate already represents $ value per $1 spend (e.g. 0.05 for 5x at 1cpp)
              monthlyValue = spending.monthlySpend * bestRewardRate
            } else {
              // rewardRate is points per $1. Convert to dollars using pointValue
              monthlyValue = spending.monthlySpend * bestRewardRate * effectivePointValue
            }
          } else {
            // Cashback cards – rewardRate is direct cash percentage or dollar multiplier
            monthlyValue = spending.monthlySpend * bestRewardRate
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

        // Calculate benefits value with customizations and global preferences
        let benefitsValue = 0
        const benefitsBreakdown = []
        
        // Check if benefits should be included based on global calculation preferences
        const shouldIncludeBenefits = calculationPreferences.calculationMode === 'comprehensive' 
          ? calculationPreferences.includeBenefits 
          : calculationPreferences.calculationMode !== 'rewards_only' && calculationPreferences.calculationMode !== 'net_value'
        
        // Get card-specific customizations
        const cardCustomization = cardCustomizations[card.id]
        
        for (const benefit of benefits) {
          let personalValue = 0
          
          if (shouldIncludeBenefits) {
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
          } else {
            console.log(`  🎁 ${benefit.name}: disabled by global calculation preferences`)
          }
          
          benefitsValue += personalValue
          
          benefitsBreakdown.push({
            benefitName: benefit.name,
            officialValue: benefit.annualValue || 0,
            personalValue,
            category: benefit.category
          })
        }
        
        // Calculate net annual value based on global calculation preferences
        let netAnnualValue = totalAnnualValue + benefitsValue
        
        // Apply annual fees based on calculation preferences
        const shouldIncludeAnnualFees = calculationPreferences.calculationMode === 'comprehensive' 
          ? calculationPreferences.includeAnnualFees 
          : calculationPreferences.calculationMode !== 'rewards_only'
        
        if (shouldIncludeAnnualFees) {
          netAnnualValue -= card.annualFee
        }

        // Apply signup bonus based on calculation preferences
        const shouldIncludeSignupBonuses = calculationPreferences.calculationMode === 'comprehensive' 
          ? calculationPreferences.includeSignupBonuses 
          : calculationPreferences.calculationMode !== 'rewards_only' && calculationPreferences.calculationMode !== 'net_value'
        
        let signupBonusValue = 0
        if (shouldIncludeSignupBonuses && card.signupBonus) {
          if (card.rewardType === 'points') {
            // For points cards, convert points to cash value
            const cardCustomization = cardCustomizations[card.id]
            const effectivePointValue = cardCustomization?.pointValue || pointValue
            signupBonusValue = card.signupBonus * effectivePointValue
          } else {
            // For cashback cards, use the signup bonus directly
            signupBonusValue = card.signupBonus
          }
          netAnnualValue += signupBonusValue
        }

        if (shouldIncludeAnnualFees) {
          console.log(`  📈 Total annual value: $${totalAnnualValue.toFixed(2)}, Benefits: $${benefitsValue.toFixed(2)}, Annual Fee: -$${card.annualFee}, Signup Bonus: +$${signupBonusValue.toFixed(2)}, Net: $${netAnnualValue.toFixed(2)}`)
        } else {
          console.log(`  📈 Total annual value: $${totalAnnualValue.toFixed(2)}, Benefits: $${benefitsValue.toFixed(2)}, Annual Fee: ignored, Signup Bonus: +$${signupBonusValue.toFixed(2)}, Net: $${netAnnualValue.toFixed(2)}`)
        }

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