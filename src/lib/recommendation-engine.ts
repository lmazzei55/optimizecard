import { prisma } from './prisma'

export interface UserSpending {
  categoryId: string
  categoryName: string
  monthlySpend: number
}

export interface CardRecommendation {
  cardId: string
  cardName: string
  issuer: string
  annualFee: number
  rewardType: 'cashback' | 'points'
  totalAnnualValue: number
  netAnnualValue: number // After annual fee
  categoryBreakdown: {
    categoryName: string
    monthlySpend: number
    rewardRate: number
    monthlyValue: number
    annualValue: number
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
  ownedCardIds?: string[]
}

export async function calculateCardRecommendations(
  options: RecommendationOptions
): Promise<CardRecommendation[]> {
  const { userSpending, rewardPreference, pointValue = 0.01, ownedCardIds = [] } = options

  // Get all active credit cards with their category rewards
  const cards = await prisma.creditCard.findMany({
    where: { isActive: true },
    include: {
      categoryRewards: {
        include: {
          category: true,
        },
      },
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
      let monthlyValue = spending.monthlySpend * rewardRate
      
      // For points cards, convert to dollar value
      if (card.rewardType === 'points') {
        monthlyValue = monthlyValue * effectivePointValue
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

    const netAnnualValue = totalAnnualValue - card.annualFee

    const recommendation: CardRecommendation = {
      cardId: card.id,
      cardName: card.name,
      issuer: card.issuer,
      annualFee: card.annualFee,
      rewardType: card.rewardType as 'cashback' | 'points',
      totalAnnualValue,
      netAnnualValue,
      categoryBreakdown,
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