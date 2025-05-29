import { prisma } from './prisma'

export interface UserSpending {
  categoryId: string
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
  rewardPreference: 'cashback' | 'points'
  pointValue?: number // For points cards, how much user values 1 point
  benefitValuations?: BenefitValuation[] // User's personal valuation of benefits
  ownedCardIds?: string[]
}

export async function calculateCardRecommendations(
  options: RecommendationOptions
): Promise<CardRecommendation[]> {
  const { 
    userSpending, 
    rewardPreference, 
    pointValue = 0.01, 
    benefitValuations = [],
    ownedCardIds = [] 
  } = options

  // Get all active credit cards with their category rewards and benefits
  const cards = await prisma.creditCard.findMany({
    where: { isActive: true },
    include: {
      categoryRewards: {
        include: {
          category: true,
        },
      },
      benefits: true,
    },
  })

  const recommendations: CardRecommendation[] = []

  for (const card of cards) {
    let totalAnnualValue = 0
    const categoryBreakdown: CardRecommendation['categoryBreakdown'] = []

    // Calculate value for each spending category
    for (const spending of userSpending) {
      const categoryReward = card.categoryRewards.find(
        (reward) => reward.categoryId === spending.categoryId
      )

      let rewardRate = card.baseReward
      let effectivePointValue = card.pointValue || 0.01

      // Use category-specific reward rate if available
      if (categoryReward) {
        rewardRate = categoryReward.rewardRate * card.baseReward
      }

      // For points cards, use user's point valuation if they prefer points
      if (card.rewardType === 'points' && rewardPreference === 'points') {
        effectivePointValue = pointValue
      }

      // Calculate monthly and annual value
      let monthlyValue: number
      
      if (card.rewardType === 'points') {
        // For points cards: baseReward is the points multiplier
        const pointsEarned = spending.monthlySpend * rewardRate
        monthlyValue = pointsEarned * effectivePointValue
      } else {
        // For cashback cards: baseReward is the cash percentage
        monthlyValue = spending.monthlySpend * rewardRate
      }

      // Apply category limits if they exist
      if (categoryReward?.maxReward && categoryReward?.period) {
        const periodMultiplier = categoryReward.period === 'monthly' ? 1 : 
                                categoryReward.period === 'quarterly' ? 3 : 12
        const maxMonthlyValue = categoryReward.maxReward / periodMultiplier
        monthlyValue = Math.min(monthlyValue, maxMonthlyValue)
      }

      const annualValue = monthlyValue * 12
      totalAnnualValue += annualValue

      categoryBreakdown.push({
        categoryName: spending.categoryName,
        monthlySpend: spending.monthlySpend,
        rewardRate: categoryReward?.rewardRate || 1,
        monthlyValue,
        annualValue,
      })
    }

    // Calculate benefits value
    let benefitsValue = 0
    const benefitsBreakdown: CardRecommendation['benefitsBreakdown'] = []

    for (const benefit of card.benefits) {
      // Find user's personal valuation for this benefit
      const userValuation = benefitValuations.find(
        (val) => val.benefitId === benefit.id
      )
      
      const personalValue = userValuation?.personalValue ?? 0 // Default to 0 if not specified
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
      totalAnnualValue,
      benefitsValue,
      netAnnualValue,
      categoryBreakdown,
      benefitsBreakdown,
    }

    // Add signup bonus information if available
    if (card.signupBonus && card.signupSpend && card.signupTimeframe) {
      recommendation.signupBonus = {
        amount: card.signupBonus,
        requiredSpend: card.signupSpend,
        timeframe: card.signupTimeframe,
      }
    }

    recommendations.push(recommendation)
  }

  // Sort by net annual value (highest first)
  recommendations.sort((a, b) => b.netAnnualValue - a.netAnnualValue)

  return recommendations
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