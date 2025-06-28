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
    cardRewardType: 'cashback' | 'points'
  }[]
  description: string
}

export async function calculateMultiCardStrategies(
  options: RecommendationOptions & {
    calculationPreferences?: {
      includeAnnualFees: boolean
      includeBenefits: boolean
      includeSignupBonuses: boolean
      calculationMode: string
    }
  }
): Promise<MultiCardStrategy[]> {
  // First get all individual card recommendations
  const individualCards = await calculateCardRecommendations(options)
  
  console.log(`🔧 DEBUGGING: calculateMultiCardStrategies starting with ${individualCards.length} cards:`)
  individualCards.slice(0, 5).forEach((card, index) => {
    console.log(`  ${index}: ${card.cardName} (${card.rewardType}) - Net: $${card.netAnnualValue}`)
  })
  
  if (individualCards.length < 2) {
    return []
  }

  // Apply calculation preferences if provided
  const calculationPreferences = options.calculationPreferences || {
    includeAnnualFees: true,
    includeBenefits: true,
    includeSignupBonuses: true,
    calculationMode: 'comprehensive'
  }

  const strategies: MultiCardStrategy[] = []

  // Try 2-card combinations
  console.log(`🔧 DEBUGGING: About to call findBestTwoCardCombination with ${individualCards.length} cards`)
  
  // Check for problematic cards
  const amexPlatinum = individualCards.find(card => card.cardName.includes('American Express Platinum'))
  const capitalOneCards = individualCards.filter(card => card.cardName.includes('Capital One'))
  
  if (amexPlatinum) {
    console.log(`🔧 AMEX PLATINUM FOUND in individual cards:`)
    console.log(`  Name: ${amexPlatinum.cardName}`)
    console.log(`  Net annual value: $${amexPlatinum.netAnnualValue}`)
    console.log(`  Category breakdown:`)
    amexPlatinum.categoryBreakdown.forEach(cat => {
      console.log(`    ${cat.categoryName}: $${cat.monthlyValue}/mo (rate: ${cat.rewardRate})`)
    })
  }
  
  if (capitalOneCards.length > 0) {
    console.log(`🔧 CAPITAL ONE CARDS FOUND: ${capitalOneCards.length}`)
    capitalOneCards.forEach(card => {
      console.log(`  ${card.cardName}: Net $${card.netAnnualValue}`)
    })
  }
  
  try {
    const twoCardStrategy = await findBestTwoCardCombination(individualCards, options)
    if (twoCardStrategy) {
      console.log(`🔧 DEBUGGING: 2-card strategy returned with net value: $${twoCardStrategy.netAnnualValue}`)
      
      // Check if problematic cards are in the result
      const hasAmexPlatinum = twoCardStrategy.categoryAllocations.some(alloc => alloc.bestCard.includes('American Express Platinum'))
      const hasCapitalOne = twoCardStrategy.categoryAllocations.some(alloc => alloc.bestCard.includes('Capital One'))
      
      if (hasAmexPlatinum) {
        console.log(`🔧 AMEX PLATINUM IN 2-CARD RESULT:`)
        twoCardStrategy.categoryAllocations
          .filter(alloc => alloc.bestCard.includes('American Express Platinum'))
          .forEach(alloc => {
            console.log(`  Category: ${alloc.categoryName}`)
            console.log(`  Monthly: $${alloc.monthlyValue}`)
            console.log(`  Annual: $${alloc.annualValue}`)
            console.log(`  Rate: ${alloc.rewardRate}x`)
          })
      }
      
      if (hasCapitalOne) {
        console.log(`🔧 CAPITAL ONE IN 2-CARD RESULT:`)
        twoCardStrategy.categoryAllocations
          .filter(alloc => alloc.bestCard.includes('Capital One'))
          .forEach(alloc => {
            console.log(`  Card: ${alloc.bestCard}`)
            console.log(`  Category: ${alloc.categoryName}`)
            console.log(`  Monthly: $${alloc.monthlyValue}`)
            console.log(`  Annual: $${alloc.annualValue}`)
          })
      }
      
      strategies.push(twoCardStrategy)
    } else {
      console.log(`🔧 DEBUGGING: No 2-card strategy returned`)
    }
  } catch (error) {
    console.error(`🔧 DEBUGGING: 2-card function threw error:`, error)
  }

  // Try 3-card combinations
  const threeCardStrategy = await findBestThreeCardCombination(individualCards, options)
  if (threeCardStrategy) {
    console.log(`🔧 DEBUGGING: 3-card strategy returned with net value: $${threeCardStrategy.netAnnualValue}`)
    strategies.push(threeCardStrategy)
  }

  // Try category specialist combinations
  const specialistStrategy = await findCategorySpecialistCombination(individualCards, options)
  if (specialistStrategy) {
    strategies.push(specialistStrategy)
  }

  // Debug final strategies before returning
  console.log(`🔧 DEBUGGING: Final strategies before return (${strategies.length} total):`)
  strategies.forEach((strategy, strategyIndex) => {
    console.log(`  Strategy ${strategyIndex}: ${strategy.strategyName}`)
    console.log(`    Net Value: $${strategy.netAnnualValue}`)
    console.log(`    Category Allocations:`)
    strategy.categoryAllocations.forEach((allocation, allocIndex) => {
      console.log(`      ${allocIndex}: ${allocation.categoryName} - ${allocation.bestCard} - Annual: $${allocation.annualValue}`)
      console.log(`        Display Rate: ${allocation.rewardRate}x, Raw Rate: ${allocation.rewardRate}`)
    })
  })

  return strategies.sort((a, b) => b.netAnnualValue - a.netAnnualValue)
}

async function findBestTwoCardCombination(
  cards: CardRecommendation[],
  options: RecommendationOptions & {
    calculationPreferences?: {
      includeAnnualFees: boolean
      includeBenefits: boolean
      includeSignupBonuses: boolean
      calculationMode: string
    }
  }
): Promise<MultiCardStrategy | null> {
  console.log(`🔧 DEBUGGING: findBestTwoCardCombination ENTRY - received ${cards.length} cards`)
  
  let bestStrategy: MultiCardStrategy | null = null
  let bestValue = -Infinity

  console.log(`🔧 DEBUGGING: findBestTwoCardCombination testing ${Math.min(cards.length, 10)} cards`)
  
  // Debug the actual cards being tested
  cards.slice(0, 10).forEach((card, index) => {
    console.log(`  2-card test card ${index}: ${card.cardName} (ID: ${card.cardId})`)
  })

  // Try all combinations of 2 different cards
  let combinationsTested = 0
  for (let i = 0; i < Math.min(cards.length, 10); i++) {
    for (let j = i + 1; j < Math.min(cards.length, 10); j++) {
      // Ensure we're using different cards
      if (cards[i].cardId === cards[j].cardId) {
        console.log(`🔧 DEBUGGING: Skipping duplicate card IDs: ${cards[i].cardName} (${cards[i].cardId}) === ${cards[j].cardName} (${cards[j].cardId})`)
        continue
      }
      
      combinationsTested++
      console.log(`🔧 DEBUGGING: Testing 2-card combo ${combinationsTested}: ${cards[i].cardName} + ${cards[j].cardName}`)
      
      try {
        const strategy = calculateOptimalCardUsage([cards[i], cards[j]], options)
        if (strategy && strategy.netAnnualValue > bestValue) {
          bestValue = strategy.netAnnualValue
          bestStrategy = strategy
          bestStrategy.strategyName = 'Best 2-Card Combination'
          bestStrategy.description = `Optimal combination of ${cards[i].cardName} and ${cards[j].cardName} for maximum rewards.`
          console.log(`🔧 DEBUGGING: New best 2-card strategy found with value: $${bestValue}`)
        }
      } catch (error) {
        console.error(`🔧 DEBUGGING: Error testing 2-card combo ${cards[i].cardName} + ${cards[j].cardName}:`, error)
      }
    }
  }

  console.log(`🔧 DEBUGGING: Total 2-card combinations tested: ${combinationsTested}`)
  
  if (bestStrategy) {
    console.log(`🔧 DEBUGGING: Best 2-card strategy found: ${bestStrategy.strategyName}`)
    console.log(`  Net Value: $${bestStrategy.netAnnualValue}`)
    console.log(`  Category Allocations:`)
    bestStrategy.categoryAllocations.forEach((allocation, index) => {
      console.log(`    ${index}: ${allocation.categoryName} - ${allocation.bestCard} - Annual: $${allocation.annualValue}`)
    })
  } else {
    console.log(`🔧 DEBUGGING: No 2-card strategy found`)
  }

  return bestStrategy
}

async function findBestThreeCardCombination(
  cards: CardRecommendation[],
  options: RecommendationOptions & {
    calculationPreferences?: {
      includeAnnualFees: boolean
      includeBenefits: boolean
      includeSignupBonuses: boolean
      calculationMode: string
    }
  }
): Promise<MultiCardStrategy | null> {
  let bestStrategy: MultiCardStrategy | null = null
  let bestValue = -Infinity

  // Try all combinations of 3 different cards (limit to top 8 cards for performance)
  for (let i = 0; i < Math.min(cards.length, 8); i++) {
    for (let j = i + 1; j < Math.min(cards.length, 8); j++) {
      for (let k = j + 1; k < Math.min(cards.length, 8); k++) {
        // Ensure we're using different cards
        if (cards[i].cardId === cards[j].cardId || 
            cards[i].cardId === cards[k].cardId || 
            cards[j].cardId === cards[k].cardId) continue
        
        const strategy = calculateOptimalCardUsage([cards[i], cards[j], cards[k]], options)
        if (strategy && strategy.netAnnualValue > bestValue) {
          bestValue = strategy.netAnnualValue
          bestStrategy = strategy
          bestStrategy.strategyName = 'Best 3-Card Combination'
          bestStrategy.description = `Optimal combination of ${cards[i].cardName}, ${cards[j].cardName}, and ${cards[k].cardName} for maximum rewards.`
        }
      }
    }
  }

  return bestStrategy
}

async function findCategorySpecialistCombination(
  cards: CardRecommendation[],
  options: RecommendationOptions & {
    calculationPreferences?: {
      includeAnnualFees: boolean
      includeBenefits: boolean
      includeSignupBonuses: boolean
      calculationMode: string
    }
  }
): Promise<MultiCardStrategy | null> {
  // Find cards that excel in specific categories
  const categorySpecialists: { [category: string]: CardRecommendation } = {}
  
  console.log(`🔧 DEBUGGING: findCategorySpecialistCombination analyzing ${cards.slice(0, 15).length} cards`)
  
  for (const card of cards.slice(0, 15)) { // Limit to top 15 cards
    for (const category of card.categoryBreakdown) {
      if (category.rewardRate >= 2.0) { // 2x+ rewards
        if (!categorySpecialists[category.categoryName] || 
            category.rewardRate > (categorySpecialists[category.categoryName].categoryBreakdown.find(c => c.categoryName === category.categoryName)?.rewardRate || 0)) {
          categorySpecialists[category.categoryName] = card
          console.log(`🔧 DEBUGGING: Found specialist: ${card.cardName} for ${category.categoryName} (${category.rewardRate}x)`)
        }
      }
    }
  }

  // Select best 2-3 specialist cards, ensuring they're different
  const uniqueSpecialistCards = Array.from(new Set(Object.values(categorySpecialists)
    .map(card => card.cardId)))
    .map(cardId => Object.values(categorySpecialists).find(card => card.cardId === cardId)!)
    .slice(0, 3)
  
  console.log(`🔧 DEBUGGING: Selected ${uniqueSpecialistCards.length} unique specialist cards:`)
  uniqueSpecialistCards.forEach((card, index) => {
    console.log(`  ${index}: ${card.cardName} (${card.rewardType})`)
  })
  
  if (uniqueSpecialistCards.length >= 2) {
    const strategy = calculateOptimalCardUsage(uniqueSpecialistCards, options)
    if (strategy) {
      console.log(`🔧 DEBUGGING: Specialist strategy created with net value: $${strategy.netAnnualValue}`)
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
  options: RecommendationOptions & {
    calculationPreferences?: {
      includeAnnualFees: boolean
      includeBenefits: boolean
      includeSignupBonuses: boolean
      calculationMode: string
    }
  }
): MultiCardStrategy | null {
  if (cards.length === 0) return null

  // Apply calculation preferences to determine what to include
  const calculationPreferences = options.calculationPreferences || {
    includeAnnualFees: true,
    includeBenefits: true,
    includeSignupBonuses: true,
    calculationMode: 'comprehensive'
  }

  // Debug what cards we're working with
  console.log(`🔧 DEBUGGING: calculateOptimalCardUsage called with ${cards.length} cards:`)
  cards.forEach((card, index) => {
    console.log(`  ${index}: ${card.cardName} (${card.rewardType})`)
    // Special debugging for American Express Platinum Card
    if (card.cardName.includes('American Express Platinum')) {
      console.log(`🔧 AMEX PLATINUM ENTRY DEBUG:`)
      console.log(`  Net annual value: ${card.netAnnualValue}`)
      console.log(`  Total annual value: ${card.totalAnnualValue}`)
      console.log(`  Annual fee: ${card.annualFee}`)
      console.log(`  Benefits value: ${card.benefitsValue}`)
      console.log(`  Category breakdown:`)
      card.categoryBreakdown.forEach(cat => {
        console.log(`    ${cat.categoryName}: ${cat.monthlyValue}/mo, rate: ${cat.rewardRate}`)
      })
    }
  })

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
    // Only include annual fees if calculation preferences allow it
    if (calculationPreferences.includeAnnualFees) {
      totalAnnualFees += card.annualFee
    }
  })

  // Create a matrix of card values for each category
  const categoryCardValues: { [categoryName: string]: { [cardId: string]: { value: number, rate: number } } } = {}
  
  console.log(`🔧 DEBUGGING: Building category card values matrix for ${cards.length} cards`)
  
  for (const spending of options.userSpending) {
    categoryCardValues[spending.categoryName] = {}
    
    for (const card of cards) {
      const categoryReward = card.categoryBreakdown.find(c => c.categoryName === spending.categoryName)
      if (categoryReward) {
        categoryCardValues[spending.categoryName][card.cardId] = {
          value: categoryReward.monthlyValue,
          rate: categoryReward.rewardRate
        }
        
        // Debug American Express Platinum Card specifically
        if (card.cardName.includes('American Express Platinum') && spending.categoryName === 'Travel') {
          console.log(`🔧 AMEX PLATINUM TRAVEL MATRIX DEBUG:`)
          console.log(`  Card: ${card.cardName}`)
          console.log(`  Category: ${spending.categoryName}`)
          console.log(`  Monthly spend: ${spending.monthlySpend}`)
          console.log(`  Category reward found:`, categoryReward)
          console.log(`  Monthly value: ${categoryReward.monthlyValue}`)
          console.log(`  Value being stored in matrix: ${categoryReward.monthlyValue}`)
          console.log(`  Annual value would be: ${categoryReward.monthlyValue * 12}`)
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
    // Special debugging for American Express Platinum Card
    if (card.cardName.includes('American Express Platinum')) {
      console.log(`🔧 AMEX PLATINUM FIRST PASS: Starting allocation for ${card.cardName}`)
      console.log(`  Looking at ${sortedCategories.length} categories`)
    }
    
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
        
        // Debug American Express Platinum Card specifically
        if (card.cardName.includes('American Express Platinum') && spending.categoryName === 'Travel') {
          console.log(`🔧 AMEX PLATINUM TRAVEL ALLOCATION DEBUG:`)
          console.log(`  Card: ${card.cardName}`)
          console.log(`  Category: ${spending.categoryName}`)
          console.log(`  Monthly spend: ${spending.monthlySpend}`)
          console.log(`  Card value from matrix: ${cardValue.value}`)
          console.log(`  Card rate from matrix: ${cardValue.rate}`)
          console.log(`  Best value: ${bestValue}`)
          console.log(`  Annual calculation: ${bestValue} * 12 = ${bestValue * 12}`)
        }
      }
    }
    
    if (bestCategory && bestValue > 0) {
      const annualValue = bestValue * 12
      totalAnnualValue += annualValue
      
      // For points cards, convert decimal rate to multiplier for display (0.05 -> 5)
      const displayRate = card.rewardType === 'points' ? bestRate * 100 : bestRate
      
      // Special debugging for American Express Platinum Card
      if (card.cardName.includes('American Express Platinum')) {
        console.log(`🔧 AMEX PLATINUM FIRST PASS: ALLOCATED!`)
        console.log(`  Category: ${bestCategory.categoryName}`)
        console.log(`  Monthly value: ${bestValue}`)
        console.log(`  Annual value: ${annualValue} (${bestValue} * 12)`)
        console.log(`  Display rate: ${displayRate}x`)
        console.log(`  Raw rate: ${bestRate}`)
      }
      
      // Only log detailed info for problematic cards
      if (card.cardName.includes('American Express Platinum') || card.cardName.includes('Capital One')) {
        console.log(`🔧 Multi-card allocation for ${card.cardName}:`)
        console.log(`  Category: ${bestCategory.categoryName}`)
        console.log(`  Monthly value: $${bestValue.toFixed(2)}`)
        console.log(`  Annual value: $${annualValue.toFixed(2)} (${bestValue} * 12)`)
        console.log(`  Display rate: ${displayRate}x (${card.rewardType})`)
        console.log(`  Raw rate: ${bestRate}`)
      }
      
      // Debug American Express Platinum Card specifically
      if (card.cardName.includes('American Express Platinum')) {
        console.log(`🔧 AMEX PLATINUM ANNUAL VALUE DEBUG:`)
        console.log(`  Card: ${card.cardName}`)
        console.log(`  Category: ${bestCategory.categoryName}`)
        console.log(`  Monthly value (bestValue): ${bestValue}`)
        console.log(`  Annual calculation: ${bestValue} * 12 = ${annualValue}`)
        console.log(`  About to push to categoryAllocations: ${annualValue}`)
      }
      
      console.log(`⚠️ DEBUGGING: annualValue being pushed to categoryAllocations: ${annualValue}`)
      
      categoryAllocations.push({
        categoryName: bestCategory.categoryName,
        bestCard: card.cardName,
        monthlySpend: bestCategory.monthlySpend,
        rewardRate: displayRate,
        monthlyValue: bestValue,
        annualValue,
        cardRewardType: card.rewardType
      })
      
      cardUsage[card.cardId].categories.push(bestCategory.categoryName)
      cardUsage[card.cardId].value += annualValue
      
      allocatedCategories.add(bestCategory.categoryName)
      usedCards.add(card.cardId)
    } else {
      // Special debugging for American Express Platinum Card
      if (card.cardName.includes('American Express Platinum')) {
        console.log(`🔧 AMEX PLATINUM FIRST PASS: NOT ALLOCATED - no suitable category found`)
        console.log(`  Best category: ${bestCategory}`)
        console.log(`  Best value: ${bestValue}`)
      }
    }
  }
  
  // Second pass: Assign remaining categories to the best available card
  for (const spending of sortedCategories) {
    if (allocatedCategories.has(spending.categoryName)) continue
    
    console.log(`🔧 SECOND PASS: Looking for best card for ${spending.categoryName}`)
    
    let bestCard: CardRecommendation | null = null
    let bestValue = 0
    let bestRate = 0
    
    for (const card of cards) {
      const cardValue = categoryCardValues[spending.categoryName][card.cardId]
      if (cardValue && cardValue.value > bestValue) {
        bestValue = cardValue.value
        bestRate = cardValue.rate
        bestCard = card
        
        // Debug American Express Platinum Card specifically
        if (card.cardName.includes('American Express Platinum')) {
          console.log(`🔧 AMEX PLATINUM SECOND PASS: Considered for ${spending.categoryName}, value: ${cardValue.value}, rate: ${cardValue.rate}`)
        }
      }
    }
    
    if (bestCard && bestValue > 0) {
      const annualValue = bestValue * 12
      totalAnnualValue += annualValue
      
      // For points cards, convert decimal rate to multiplier for display (0.05 -> 5)
      const displayRate = bestCard.rewardType === 'points' ? bestRate * 100 : bestRate
      
      // Special debugging for American Express Platinum Card
      if (bestCard.cardName.includes('American Express Platinum')) {
        console.log(`🔧 AMEX PLATINUM SECOND PASS: ALLOCATED!`)
        console.log(`  Category: ${spending.categoryName}`)
        console.log(`  Monthly value: ${bestValue}`)
        console.log(`  Annual value: ${annualValue} (${bestValue} * 12)`)
        console.log(`  Display rate: ${displayRate}x`)
        console.log(`  Raw rate: ${bestRate}`)
      }
      
      // Only log detailed info for problematic cards
      if (bestCard.cardName.includes('American Express Platinum') || bestCard.cardName.includes('Capital One')) {
        console.log(`🔧 Multi-card second pass for ${bestCard.cardName}:`)
        console.log(`  Category: ${spending.categoryName}`)
        console.log(`  Monthly value: $${bestValue.toFixed(2)}`)
        console.log(`  Annual value: $${annualValue.toFixed(2)} (${bestValue} * 12)`)
        console.log(`  Display rate: ${displayRate}x (${bestCard.rewardType})`)
        console.log(`  Raw rate: ${bestRate}`)
        console.log(`  ⚠️ DEBUGGING: annualValue being pushed to categoryAllocations: ${annualValue}`)
      }
      
      categoryAllocations.push({
        categoryName: spending.categoryName,
        bestCard: bestCard.cardName,
        monthlySpend: spending.monthlySpend,
        rewardRate: displayRate,
        monthlyValue: bestValue,
        annualValue,
        cardRewardType: bestCard.rewardType
      })
      
      cardUsage[bestCard.cardId].categories.push(spending.categoryName)
      cardUsage[bestCard.cardId].value += annualValue
      
      allocatedCategories.add(spending.categoryName)
    }
  }

  // Conditionally add benefits based on calculation preferences
  let totalBenefitsValue = 0
  if (calculationPreferences.includeBenefits) {
    const allBenefits = new Set<string>()
    cards.forEach(card => {
      card.benefitsBreakdown.forEach(benefit => {
        const benefitKey = `${benefit.benefitName}-${benefit.category}`
        if (!allBenefits.has(benefitKey)) {
          allBenefits.add(benefitKey)
          totalBenefitsValue += benefit.personalValue
        }
      })
    })
  }

  // Conditionally add welcome bonuses based on calculation preferences
  let totalWelcomeBonuses = 0
  if (calculationPreferences.includeSignupBonuses) {
    cards.forEach(card => {
      if (card.signupBonus && card.signupBonus.amount > 0) {
        totalWelcomeBonuses += card.signupBonus.amount
      }
    })
  }

  // Calculate the total value based on what's included
  totalAnnualValue = totalAnnualValue + totalBenefitsValue + totalWelcomeBonuses

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
          
          // For points cards, convert decimal rate to multiplier for display (0.05 -> 5)
          const displayRate = assignedCard.rewardType === 'points' ? cardValue.rate * 100 : cardValue.rate
          
          resetAllocations.push({
            categoryName: spending.categoryName,
            bestCard: assignedCard.cardName,
            monthlySpend: spending.monthlySpend,
            rewardRate: displayRate,
            monthlyValue: cardValue.value,
            annualValue,
            cardRewardType: assignedCard.rewardType
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

  // Debug final category allocations before returning
  console.log(`🔧 DEBUGGING: Final categoryAllocations before return:`)
  categoryAllocations.forEach((allocation, index) => {
    console.log(`  ${index}: ${allocation.categoryName} - ${allocation.bestCard} - Annual: $${allocation.annualValue}`)
  })

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