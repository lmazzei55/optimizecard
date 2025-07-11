import { prisma, withRetry } from './prisma'

export interface UserSpending {
  categoryId?: string
  subCategoryId?: string
  categoryName: string
  monthlySpend: number
}

export interface BenefitValuation {
  benefitId: string
  personalValue: number // How much the user values this benefit annually
}

export interface CardRecommendation {
  cardId: string
  cardName: string
  issuer: string
  annualFee: number
  rewardType: 'cashback' | 'points'
  applicationUrl?: string
  totalAnnualValue: number
  benefitsValue: number // Total value of benefits user can utilize
  netAnnualValue: number // After annual fee, including benefits
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

export interface RecommendationOptions {
  userSpending: UserSpending[]
  rewardPreference: 'cashback' | 'points' | 'best_overall'
  pointValue?: number // Default point value for cards without custom values
  benefitValuations?: BenefitValuation[] // Default benefit valuations
  cardCustomizations?: {
    [cardId: string]: {
      pointValue?: number
      benefitValuations?: BenefitValuation[]
      // New format for per-card customizations
      benefitValues?: Record<string, number>
      enabledBenefits?: Record<string, boolean>
    }
  }
  ownedCardIds?: string[]
  subscriptionTier?: 'free' | 'premium' // Freemium filtering
}

export async function calculateCardRecommendations(
  options: RecommendationOptions
): Promise<CardRecommendation[]> {
  const { 
    userSpending, 
    rewardPreference, 
    pointValue = 0.01, 
    benefitValuations = [],
    cardCustomizations = {},
    ownedCardIds = [],
    subscriptionTier = 'free'
  } = options

  // Get all active credit cards with their category rewards and benefits
  let whereClause: any = { 
    isActive: true,
    // Exclude owned cards from recommendations
    ...(ownedCardIds.length > 0 && { id: { notIn: ownedCardIds } })
  }
  
  // Filter by reward type based on user preference
  if (rewardPreference === 'cashback') {
    whereClause.rewardType = 'cashback'
  } else if (rewardPreference === 'points') {
    whereClause.rewardType = 'points'
  }
  // For 'best_overall', show all cards (no additional filter)

  // Apply subscription tier filter
  if (subscriptionTier === 'free') {
    // Free tier: only show no annual fee cards
    whereClause.tier = 'free'
  } else if (subscriptionTier === 'premium') {
    // Premium tier: show all cards (both free and premium)
    // No additional filter needed
  }

  try {
    let cards: any[] = []
    
    try {
      cards = await withRetry(async () => {
        return await prisma.creditCard.findMany({
          where: whereClause,
          include: {
            categoryRewards: {
              include: {
                category: true,
                subCategory: true,
              },
            },
            benefits: true,
          },
        })
      })
    } catch (error: any) {
      // Handle prepared statement conflicts with multiple retries
      if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
        console.log('⚠️ Prepared statement conflict in recommendation engine, retrying with fresh connection...')
        
        // Try multiple times with delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000)) // Wait 1s, 2s, 3s
            
            cards = await prisma.creditCard.findMany({
              where: whereClause,
              include: {
                categoryRewards: {
                  include: {
                    category: true,
                    subCategory: true,
                  },
                },
                benefits: true,
              },
            })
            console.log(`✅ Retry ${attempt} successful, found ${cards.length} cards`)
            break // Success, exit retry loop
          } catch (retryError: any) {
            console.log(`⚠️ Retry ${attempt} failed:`, retryError.message)
            if (attempt === 3) {
              // On final attempt, return empty array with warning
              console.log('❌ All retries failed, returning empty results')
              return []
            }
          }
        }
      } else {
        throw error // Re-throw other errors
      }
    }

    const recommendations: CardRecommendation[] = []

    for (const card of cards) {
      let totalAnnualValue = 0
      const categoryBreakdownMap = new Map<string, {
        categoryName: string
        monthlySpend: number
        rewardRate: number
        monthlyValue: number
        annualValue: number
      }>()
      
      // Get card-specific customizations or use defaults
      const cardCustomization = cardCustomizations[card.id]
      const effectivePointValue = cardCustomization?.pointValue || pointValue
      const effectiveBenefitValuations = cardCustomization?.benefitValuations || benefitValuations

      // Calculate value for each spending category
      for (const spending of userSpending) {
        // Find the best matching reward for this spending
        let categoryReward = null
        
        if (spending.subCategoryId) {
          // Look for subcategory-specific reward first
          categoryReward = card.categoryRewards.find(
            (reward: any) => reward.subCategoryId === spending.subCategoryId
          )
        }
        
        if (!categoryReward && spending.categoryId) {
          // Fall back to category-level reward
          categoryReward = card.categoryRewards.find(
            (reward: any) => reward.categoryId === spending.categoryId
          )
        }

        let rewardRate = card.baseReward
        let finalPointValue = card.pointValue || 0.01

        // Use category-specific reward rate if available
        if (categoryReward) {
          rewardRate = categoryReward.rewardRate
        }

        // For points cards, use card-specific point valuation if available, or user's preference
        if (card.rewardType === 'points' && (rewardPreference === 'points' || rewardPreference === 'best_overall')) {
          finalPointValue = effectivePointValue
        }

        // Calculate monthly and annual value with proper tiered rewards
        let monthlyValue: number
        
        // Check if there are spending caps that affect this category
        if (categoryReward?.maxReward && categoryReward?.period) {
          // Calculate the spending cap per month
          const periodMultiplier = categoryReward.period === 'monthly' ? 1 : 
                                  categoryReward.period === 'quarterly' ? 3 : 12
          const maxSpendingPerMonth = categoryReward.maxReward / (categoryReward.rewardRate * periodMultiplier)
          
          // Calculate tiered rewards
          const cappedSpending = Math.min(spending.monthlySpend, maxSpendingPerMonth)
          const overageSpending = Math.max(0, spending.monthlySpend - maxSpendingPerMonth)
          
          if (card.rewardType === 'points') {
            if (rewardRate < 1) {
              // rewardRate already represents $ value per $1 spend (e.g. 0.05 for 5x at 1cpp)
              monthlyValue = (cappedSpending * rewardRate) + (overageSpending * card.baseReward)
            } else {
              // rewardRate is points per $1. Convert to dollars using pointValue
              const cappedPoints = cappedSpending * rewardRate * finalPointValue
              const overagePoints = overageSpending * card.baseReward * finalPointValue
              monthlyValue = cappedPoints + overagePoints
            }
          } else {
            // Cashback: bonus rate on capped amount + base rate on overage
            monthlyValue = (cappedSpending * rewardRate) + (overageSpending * card.baseReward)
          }
        } else {
          // No spending caps - use full bonus rate
          if (card.rewardType === 'points') {
            if (rewardRate < 1) {
              // rewardRate already represents $ value per $1 spend (e.g. 0.05 for 5x at 1cpp)
              monthlyValue = spending.monthlySpend * rewardRate
            } else {
              // rewardRate is points per $1. Convert to dollars using pointValue
              monthlyValue = spending.monthlySpend * rewardRate * finalPointValue
            }
          } else {
            monthlyValue = spending.monthlySpend * rewardRate
          }
        }

        const annualValue = monthlyValue * 12
        totalAnnualValue += annualValue

        // Create a proper display name for the category breakdown
        // If this is a subcategory (contains "→"), use the full name
        // If this is a parent category that has subcategories being used, 
        // we need to avoid duplication
        const displayName = spending.categoryName

        // Check if this is a parent category and if we already have subcategories for it
        const isParentCategory = spending.categoryId && !spending.subCategoryId
        const hasSubcategoryEntries = isParentCategory && userSpending.some(s => 
          s.subCategoryId && s.categoryName.startsWith(spending.categoryName + ' →')
        )

        // Skip parent categories if they have subcategory entries to avoid duplication
        // unless the parent has its own spending beyond the subcategories
        if (isParentCategory && hasSubcategoryEntries && spending.monthlySpend === 0) {
          continue
        }

        // Use the display name as the key to aggregate spending
        const existingBreakdown = categoryBreakdownMap.get(displayName)
        if (existingBreakdown) {
          // Aggregate with existing breakdown
          const totalSpend = existingBreakdown.monthlySpend + spending.monthlySpend
          const totalMonthlyValue = existingBreakdown.monthlyValue + monthlyValue
          const totalAnnualValue = existingBreakdown.annualValue + annualValue
          
          // Calculate weighted average reward rate
          const weightedRate = totalSpend > 0 ? totalMonthlyValue / totalSpend : existingBreakdown.rewardRate
          
          categoryBreakdownMap.set(displayName, {
            categoryName: displayName,
            monthlySpend: totalSpend,
            rewardRate: weightedRate,
            monthlyValue: totalMonthlyValue,
            annualValue: totalAnnualValue,
          })
        } else {
          // Add new breakdown entry
          categoryBreakdownMap.set(displayName, {
            categoryName: displayName,
            monthlySpend: spending.monthlySpend,
            rewardRate: categoryReward?.rewardRate || card.baseReward,
            monthlyValue,
            annualValue,
          })
        }
      }

      // Convert map to array for final result
      const categoryBreakdown = Array.from(categoryBreakdownMap.values())

      // Calculate benefits value
      let benefitsValue = 0
      const benefitsBreakdown: CardRecommendation['benefitsBreakdown'] = []

      for (const benefit of card.benefits) {
        let personalValue = 0

        // Check if we have new format customizations for this card
        if (cardCustomization?.benefitValues && cardCustomization?.enabledBenefits) {
          // Use new format: benefit is enabled and has custom value
          const isEnabled = cardCustomization.enabledBenefits[benefit.name] !== false // Default to enabled
          console.log(`  🎁 Benefit ${benefit.name}: enabled=${isEnabled}, customValue=${cardCustomization.benefitValues[benefit.name]}, defaultValue=${benefit.annualValue}`)
          if (isEnabled) {
            personalValue = cardCustomization.benefitValues[benefit.name] || benefit.annualValue
          }
          // If not enabled, personalValue stays 0
        } else if (effectiveBenefitValuations.length > 0) {
          // Fall back to old format for backward compatibility
          const userValuation = effectiveBenefitValuations.find(
            (val) => val.benefitId === benefit.id
          )
          personalValue = userValuation?.personalValue ?? 0
        } else {
          // Default case: use official benefit value when no customizations exist
          personalValue = benefit.annualValue
        }
        
        benefitsValue += personalValue

        benefitsBreakdown.push({
          benefitName: benefit.name,
          officialValue: benefit.annualValue,
          personalValue,
          category: benefit.category,
        })
      }

      const netAnnualValue = totalAnnualValue + benefitsValue - card.annualFee

      const recommendation: CardRecommendation = {
        cardId: card.id,
        cardName: card.name,
        issuer: card.issuer,
        annualFee: card.annualFee,
        rewardType: card.rewardType as 'cashback' | 'points',
        applicationUrl: card.applicationUrl || undefined,
        totalAnnualValue,
        benefitsValue,
        netAnnualValue,
        categoryBreakdown,
        benefitsBreakdown,
      }

      // Add signup bonus information if available
      if (card.signupBonus && card.signupSpend && card.signupTimeframe) {
        let signupBonusValue = card.signupBonus
        
        // For points cards, convert points to dollar value
        if (card.rewardType === 'points') {
          signupBonusValue = card.signupBonus * effectivePointValue
        }
        
        recommendation.signupBonus = {
          amount: signupBonusValue, // This is now in dollar value for both cashback and points
          requiredSpend: card.signupSpend,
          timeframe: card.signupTimeframe,
        }
      }

      recommendations.push(recommendation)
    }

    // Sort by net annual value (highest first)
    recommendations.sort((a, b) => b.netAnnualValue - a.netAnnualValue)

    return recommendations
  } catch (error) {
    console.error('Error calculating recommendations:', error)
    return []
  }
}

export async function getBestCardOverall(
  options: RecommendationOptions
): Promise<CardRecommendation | null> {
  const recommendations = await calculateCardRecommendations(options)
  return recommendations[0] || null
}

export async function getBestCardPerCategory(
  options: RecommendationOptions
): Promise<{ [categoryName: string]: CardRecommendation }> {
  const { userSpending } = options
  const bestPerCategory: { [categoryName: string]: CardRecommendation } = {}

  for (const spending of userSpending) {
    // Calculate recommendations for just this category
    const singleCategoryOptions = {
      ...options,
      userSpending: [spending],
    }
    
    const recommendations = await calculateCardRecommendations(singleCategoryOptions)
    if (recommendations.length > 0) {
      bestPerCategory[spending.categoryName] = recommendations[0]
    }
  }

  return bestPerCategory
} 