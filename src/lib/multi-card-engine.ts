import { prisma } from './prisma'
import { calculateCardRecommendations, RecommendationOptions, CardRecommendation } from './recommendation-engine'

export interface MultiCardStrategy {
  strategyName: string
  totalAnnualValue: number
  totalAnnualFees: number
  netAnnualValue: number
  cards: {
    card: CardRecommendation
    recommendedCategories: string[]
    categoryValue: number
  }[]
  categoryAllocations: {
    categoryName: string
    bestCard: string
    monthlySpend: number
    rewardRate: number
    monthlyValue: number
    annualValue: number
  }[]
  description: string
}

export async function calculateMultiCardStrategies(
  options: RecommendationOptions
): Promise<MultiCardStrategy[]> {
  // First get all individual card recommendations
  const individualCards = await calculateCardRecommendations(options)
  
  if (individualCards.length < 2) {
    return []
  }

  const strategies: MultiCardStrategy[] = []

  // Strategy 1: Best 2-card combination
  const twoCardStrategy = await findBestTwoCardCombination(individualCards, options)
  if (twoCardStrategy) {
    strategies.push(twoCardStrategy)
  }

  // Strategy 2: Best 3-card combination (if we have enough cards)
  if (individualCards.length >= 3) {
    const threeCardStrategy = await findBestThreeCardCombination(individualCards, options)
    if (threeCardStrategy) {
      strategies.push(threeCardStrategy)
    }
  }

  // Strategy 3: Category specialist combination
  const specialistStrategy = await findCategorySpecialistCombination(individualCards, options)
  if (specialistStrategy) {
    strategies.push(specialistStrategy)
  }

  // Sort by net annual value
  return strategies.sort((a, b) => b.netAnnualValue - a.netAnnualValue)
}

async function findBestTwoCardCombination(
  cards: CardRecommendation[],
  options: RecommendationOptions
): Promise<MultiCardStrategy | null> {
  let bestStrategy: MultiCardStrategy | null = null
  let bestValue = -Infinity

  // Try all combinations of 2 different cards
  for (let i = 0; i < Math.min(cards.length, 10); i++) {
    for (let j = i + 1; j < Math.min(cards.length, 10); j++) {
      // Ensure we're using different cards
      if (cards[i].cardId === cards[j].cardId) continue
      
      const strategy = calculateOptimalCardUsage([cards[i], cards[j]], options)
      if (strategy && strategy.netAnnualValue > bestValue) {
        bestValue = strategy.netAnnualValue
        bestStrategy = {
          ...strategy,
          strategyName: "Best 2-Card Combination",
          description: `Optimal combination of ${cards[i].cardName} and ${cards[j].cardName} for maximum rewards across all categories.`
        }
      }
    }
  }

  return bestStrategy
}

async function findBestThreeCardCombination(
  cards: CardRecommendation[],
  options: RecommendationOptions
): Promise<MultiCardStrategy | null> {
  let bestStrategy: MultiCardStrategy | null = null
  let bestValue = -Infinity

  // Try combinations of 3 different cards
  for (let i = 0; i < Math.min(cards.length, 8); i++) {
    for (let j = i + 1; j < Math.min(cards.length, 8); j++) {
      for (let k = j + 1; k < Math.min(cards.length, 8); k++) {
        // Ensure all three cards are different
        if (cards[i].cardId === cards[j].cardId || 
            cards[i].cardId === cards[k].cardId || 
            cards[j].cardId === cards[k].cardId) continue
            
        const strategy = calculateOptimalCardUsage([cards[i], cards[j], cards[k]], options)
        if (strategy && strategy.netAnnualValue > bestValue) {
          bestValue = strategy.netAnnualValue
          bestStrategy = {
            ...strategy,
            strategyName: "Best 3-Card Combination",
            description: `Optimal combination of three cards for maximum category coverage and rewards optimization.`
          }
        }
      }
    }
  }

  return bestStrategy
}

async function findCategorySpecialistCombination(
  cards: CardRecommendation[],
  options: RecommendationOptions
): Promise<MultiCardStrategy | null> {
  // Find cards that excel in specific categories
  const categorySpecialists: { [category: string]: CardRecommendation } = {}
  
  for (const card of cards.slice(0, 15)) { // Limit to top 15 cards
    for (const category of card.categoryBreakdown) {
      if (category.rewardRate >= 2.0) { // 2x+ rewards
        if (!categorySpecialists[category.categoryName] || 
            category.rewardRate > (categorySpecialists[category.categoryName].categoryBreakdown.find(c => c.categoryName === category.categoryName)?.rewardRate || 0)) {
          categorySpecialists[category.categoryName] = card
        }
      }
    }
  }

  // Select best 2-3 specialist cards, ensuring they're different
  const uniqueSpecialistCards = Array.from(new Set(Object.values(categorySpecialists)
    .map(card => card.cardId)))
    .map(cardId => Object.values(categorySpecialists).find(card => card.cardId === cardId)!)
    .slice(0, 3)
  
  if (uniqueSpecialistCards.length >= 2) {
    const strategy = calculateOptimalCardUsage(uniqueSpecialistCards, options)
    if (strategy) {
      return {
        ...strategy,
        strategyName: "Category Specialist Strategy",
        description: `Combination of category-specific cards that excel in different spending areas for maximum specialization.`
      }
    }
  }

  return null
}

function calculateOptimalCardUsage(
  cards: CardRecommendation[],
  options: RecommendationOptions
): MultiCardStrategy | null {
  if (cards.length === 0) return null

  let totalAnnualValue = 0
  let totalAnnualFees = 0
  const categoryAllocations: MultiCardStrategy['categoryAllocations'] = []
  const cardUsage: { [cardId: string]: { card: CardRecommendation, categories: string[], value: number } } = {}

  // Initialize card usage tracking
  cards.forEach(card => {
    cardUsage[card.cardId] = {
      card,
      categories: [],
      value: 0
    }
    totalAnnualFees += card.annualFee
  })

  // Create a matrix of card values for each category
  const categoryCardValues: { [categoryName: string]: { [cardId: string]: { value: number, rate: number } } } = {}
  
  for (const spending of options.userSpending) {
    categoryCardValues[spending.categoryName] = {}
    
    for (const card of cards) {
      const categoryReward = card.categoryBreakdown.find(c => c.categoryName === spending.categoryName)
      if (categoryReward) {
        categoryCardValues[spending.categoryName][card.cardId] = {
          value: categoryReward.monthlyValue,
          rate: categoryReward.rewardRate
        }
      } else {
        // Use base reward if no specific category reward
        const baseValue = spending.monthlySpend * (card.rewardType === 'points' ? 
          (card.categoryBreakdown[0]?.rewardRate || 1) * 0.01 : 
          (card.categoryBreakdown[0]?.rewardRate || 0.01))
        categoryCardValues[spending.categoryName][card.cardId] = {
          value: baseValue,
          rate: card.categoryBreakdown[0]?.rewardRate || 0.01
        }
      }
    }
  }

  // Smart allocation: Use Hungarian algorithm approach or greedy with diversification
  const allocatedCategories = new Set<string>()
  const usedCards = new Set<string>()
  
  // Sort categories by spending amount (highest first) and cards by overall value
  const sortedCategories = options.userSpending
    .sort((a, b) => b.monthlySpend - a.monthlySpend)
  
  // First pass: Assign each card to its best remaining category
  for (const card of cards) {
    let bestCategory = null
    let bestValue = 0
    let bestRate = 0
    
    for (const spending of sortedCategories) {
      if (allocatedCategories.has(spending.categoryName)) continue
      
      const cardValue = categoryCardValues[spending.categoryName][card.cardId]
      if (cardValue && cardValue.value > bestValue) {
        bestValue = cardValue.value
        bestRate = cardValue.rate
        bestCategory = spending
      }
    }
    
    if (bestCategory && bestValue > 0) {
      const annualValue = bestValue * 12
      totalAnnualValue += annualValue
      
      categoryAllocations.push({
        categoryName: bestCategory.categoryName,
        bestCard: card.cardName,
        monthlySpend: bestCategory.monthlySpend,
        rewardRate: bestRate,
        monthlyValue: bestValue,
        annualValue
      })
      
      cardUsage[card.cardId].categories.push(bestCategory.categoryName)
      cardUsage[card.cardId].value += annualValue
      
      allocatedCategories.add(bestCategory.categoryName)
      usedCards.add(card.cardId)
    }
  }
  
  // Second pass: Assign remaining categories to the best available card
  for (const spending of sortedCategories) {
    if (allocatedCategories.has(spending.categoryName)) continue
    
    let bestCard: CardRecommendation | null = null
    let bestValue = 0
    let bestRate = 0
    
    for (const card of cards) {
      const cardValue = categoryCardValues[spending.categoryName][card.cardId]
      if (cardValue && cardValue.value > bestValue) {
        bestValue = cardValue.value
        bestRate = cardValue.rate
        bestCard = card
      }
    }
    
    if (bestCard && bestValue > 0) {
      const annualValue = bestValue * 12
      totalAnnualValue += annualValue
      
      categoryAllocations.push({
        categoryName: spending.categoryName,
        bestCard: bestCard.cardName,
        monthlySpend: spending.monthlySpend,
        rewardRate: bestRate,
        monthlyValue: bestValue,
        annualValue
      })
      
      cardUsage[bestCard.cardId].categories.push(spending.categoryName)
      cardUsage[bestCard.cardId].value += annualValue
      
      allocatedCategories.add(spending.categoryName)
    }
  }

  // Add benefits from all cards (avoid double counting)
  const allBenefits = new Set<string>()
  let totalBenefitsValue = 0
  
  cards.forEach(card => {
    card.benefitsBreakdown.forEach(benefit => {
      const benefitKey = `${benefit.benefitName}-${benefit.category}`
      if (!allBenefits.has(benefitKey)) {
        allBenefits.add(benefitKey)
        totalBenefitsValue += benefit.personalValue
      }
    })
  })

  totalAnnualValue += totalBenefitsValue

  // Format card recommendations with their usage - only include cards that are actually used
  const cardRecommendations = Object.values(cardUsage)
    .filter(usage => usage.categories.length > 0)
    .map(usage => ({
      card: usage.card,
      recommendedCategories: usage.categories,
      categoryValue: usage.value
    }))

  // If we didn't get any diversification (less than 2 cards used), try a different approach
  if (cardRecommendations.length < 2 && cards.length >= 2) {
    // Force diversification by assigning top 2 categories to different cards
    const resetCardUsage: typeof cardUsage = {}
    const resetAllocations: typeof categoryAllocations = []
    let resetTotalValue = 0
    
    cards.forEach(card => {
      resetCardUsage[card.cardId] = { card, categories: [], value: 0 }
    })
    
    const topCategories = options.userSpending
      .sort((a, b) => b.monthlySpend - a.monthlySpend)
      .slice(0, Math.min(cards.length, options.userSpending.length))
    
    // Assign each of the top categories to a different card
    topCategories.forEach((spending, index) => {
      if (index < cards.length) {
        const assignedCard = cards[index]
        const cardValue = categoryCardValues[spending.categoryName][assignedCard.cardId]
        
        if (cardValue) {
          const annualValue = cardValue.value * 12
          resetTotalValue += annualValue
          
          resetAllocations.push({
            categoryName: spending.categoryName,
            bestCard: assignedCard.cardName,
            monthlySpend: spending.monthlySpend,
            rewardRate: cardValue.rate,
            monthlyValue: cardValue.value,
            annualValue
          })
          
          resetCardUsage[assignedCard.cardId].categories.push(spending.categoryName)
          resetCardUsage[assignedCard.cardId].value += annualValue
        }
      }
    })
    
    // If forced diversification worked better (more cards used), use it
    const forcedCardRecommendations = Object.values(resetCardUsage)
      .filter(usage => usage.categories.length > 0)
    
    if (forcedCardRecommendations.length > cardRecommendations.length) {
      totalAnnualValue = resetTotalValue + totalBenefitsValue
      return {
        strategyName: "",
        description: "",
        totalAnnualValue,
        totalAnnualFees,
        netAnnualValue: totalAnnualValue - totalAnnualFees,
        cards: forcedCardRecommendations.map(usage => ({
          card: usage.card,
          recommendedCategories: usage.categories,
          categoryValue: usage.value
        })),
        categoryAllocations: resetAllocations
      }
    }
  }

  if (cardRecommendations.length === 0) return null

  const netAnnualValue = totalAnnualValue - totalAnnualFees

  return {
    strategyName: "",
    description: "",
    totalAnnualValue,
    totalAnnualFees,
    netAnnualValue,
    cards: cardRecommendations,
    categoryAllocations
  }
} 