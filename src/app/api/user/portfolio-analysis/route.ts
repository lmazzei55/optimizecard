import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'
import { calculateCardRecommendations, RecommendationOptions, UserSpending } from '@/lib/recommendation-engine'

interface PortfolioAnalysis {
  currentPortfolio: {
    cards: any[]
    totalAnnualFees: number
    totalAnnualValue: number
    netAnnualValue: number
    categoryOptimization: {
      categoryName: string
      bestCard: string
      monthlyValue: number
      annualValue: number
      isOptimal: boolean
      betterOption?: string
    }[]
  }
  optimalPortfolio: {
    totalAnnualValue: number
    netAnnualValue: number
    potentialImprovement: number
    percentageImprovement: number
  }
  gapAnalysis: {
    missingCategories: string[]
    suboptimalCategories: {
      categoryName: string
      currentCard: string
      currentValue: number
      optimalCard: string
      optimalValue: number
      improvement: number
    }[]
    recommendedAdditions: {
      cardName: string
      reason: string
      categoriesImproved: string[]
      netValueAdded: number
    }[]
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userSpending, rewardPreference, pointValue, cardCustomizations } = await request.json()

    if (!userSpending || userSpending.length === 0) {
      return NextResponse.json({ error: 'User spending data is required' }, { status: 400 })
    }

    // Get user and their owned cards
    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: {
          ownedCards: {
            include: {
              card: {
                include: {
                  categoryRewards: {
                    include: {
                      category: true,
                      subCategory: true
                    }
                  },
                  benefits: true
                }
              }
            }
          }
        }
      })
    })

    if (!user || !user.ownedCards || user.ownedCards.length === 0) {
      return NextResponse.json({ 
        error: 'No owned cards found. Please select your cards in the profile first.' 
      }, { status: 400 })
    }

    // Extract owned card IDs
    const ownedCardIds = user.ownedCards.map(uc => uc.cardId)
    const ownedCards = user.ownedCards.map(uc => uc.card)

    // Calculate current portfolio performance
    const currentPortfolioOptions: RecommendationOptions = {
      userSpending,
      rewardPreference: rewardPreference || user.rewardPreference,
      pointValue: pointValue || user.pointValue,
      cardCustomizations,
      ownedCardIds: [], // Don't exclude owned cards for this calculation
      subscriptionTier: user.subscriptionTier as 'free' | 'premium'
    }

    // Get recommendations for ALL cards (including owned) to compare
    const allCardRecommendations = await calculateCardRecommendations(currentPortfolioOptions)
    
    // Filter to just owned cards for current portfolio analysis
    const ownedCardRecommendations = allCardRecommendations.filter(rec => 
      ownedCardIds.includes(rec.cardId)
    )

    // Calculate total values for current portfolio
    const totalAnnualFees = ownedCardRecommendations.reduce((sum, card) => sum + card.annualFee, 0)
    const totalAnnualValue = ownedCardRecommendations.reduce((sum, card) => sum + card.totalAnnualValue, 0)
    const netAnnualValue = totalAnnualValue - totalAnnualFees

    // Determine which card is best for each category in current portfolio
    const categoryOptimization = userSpending.map((spending: UserSpending) => {
      let bestOwnedCard = null
      let bestOwnedValue = 0

      // Find best owned card for this category
      for (const cardRec of ownedCardRecommendations) {
        const categoryData = cardRec.categoryBreakdown.find(cb => 
          cb.categoryName === spending.categoryName
        )
        if (categoryData && categoryData.monthlyValue > bestOwnedValue) {
          bestOwnedValue = categoryData.monthlyValue
          bestOwnedCard = {
            name: cardRec.cardName,
            monthlyValue: categoryData.monthlyValue,
            annualValue: categoryData.annualValue
          }
        }
      }

      // Find the absolute best card for this category (from all cards)
      const bestOverallCard = allCardRecommendations
        .map(card => ({
          cardName: card.cardName,
          categoryData: card.categoryBreakdown.find(cb => cb.categoryName === spending.categoryName)
        }))
        .filter(item => item.categoryData)
        .sort((a, b) => (b.categoryData?.monthlyValue || 0) - (a.categoryData?.monthlyValue || 0))[0]

      const isOptimal = bestOwnedCard && bestOverallCard && 
        bestOwnedCard.name === bestOverallCard.cardName

      return {
        categoryName: spending.categoryName,
        bestCard: bestOwnedCard?.name || 'No card covers this',
        monthlyValue: bestOwnedCard?.monthlyValue || 0,
        annualValue: bestOwnedCard?.annualValue || 0,
        isOptimal,
        betterOption: !isOptimal && bestOverallCard ? bestOverallCard.cardName : undefined
      }
    })

    // Calculate optimal portfolio (best single card)
    const optimalSingleCard = allCardRecommendations[0]
    const potentialImprovement = optimalSingleCard ? 
      optimalSingleCard.netAnnualValue - netAnnualValue : 0
    const percentageImprovement = netAnnualValue > 0 ? 
      (potentialImprovement / netAnnualValue) * 100 : 0

    // Gap Analysis
    const missingCategories = categoryOptimization
      .filter((cat: any) => cat.bestCard === 'No card covers this')
      .map((cat: any) => cat.categoryName)

    const suboptimalCategories = categoryOptimization
      .filter((cat: any) => !cat.isOptimal && cat.betterOption)
      .map((cat: any) => {
        const optimalCard = allCardRecommendations.find(c => c.cardName === cat.betterOption)
        const optimalCategoryData = optimalCard?.categoryBreakdown.find(cb => 
          cb.categoryName === cat.categoryName
        )
        
        return {
          categoryName: cat.categoryName,
          currentCard: cat.bestCard,
          currentValue: cat.annualValue,
          optimalCard: cat.betterOption!,
          optimalValue: optimalCategoryData?.annualValue || 0,
          improvement: (optimalCategoryData?.annualValue || 0) - cat.annualValue
        }
      })

    // Find recommended additions (cards that would improve the portfolio)
    const recommendedAdditions = allCardRecommendations
      .filter(card => !ownedCardIds.includes(card.cardId))
      .slice(0, 3) // Top 3 recommendations
      .map(card => {
        // Find which categories this card would improve
        const categoriesImproved = userSpending
          .filter((spending: UserSpending) => {
            const currentBest = categoryOptimization.find((co: any) => 
              co.categoryName === spending.categoryName
            )
            const cardCategory = card.categoryBreakdown.find(cb => 
              cb.categoryName === spending.categoryName
            )
            return cardCategory && currentBest && 
              cardCategory.annualValue > currentBest.annualValue
          })
          .map((s: UserSpending) => s.categoryName)

        // Calculate net value added (considering annual fee)
        const valueAdded = categoriesImproved.reduce((sum: number, catName: string) => {
          const currentBest = categoryOptimization.find((co: any) => 
            co.categoryName === catName
          )
          const cardCategory = card.categoryBreakdown.find(cb => 
            cb.categoryName === catName
          )
          return sum + ((cardCategory?.annualValue || 0) - (currentBest?.annualValue || 0))
        }, 0)

        const netValueAdded = valueAdded - card.annualFee

        return {
          cardName: card.cardName,
          reason: categoriesImproved.length > 0 ? 
            `Improves ${categoriesImproved.join(', ')}` : 
            'General rewards improvement',
          categoriesImproved,
          netValueAdded
        }
      })
      .filter(rec => rec.netValueAdded > 0) // Only show cards that add positive value

    const analysis: PortfolioAnalysis = {
      currentPortfolio: {
        cards: ownedCards.map(card => ({
          id: card.id,
          name: card.name,
          issuer: card.issuer,
          annualFee: card.annualFee,
          rewardType: card.rewardType
        })),
        totalAnnualFees,
        totalAnnualValue,
        netAnnualValue,
        categoryOptimization
      },
      optimalPortfolio: {
        totalAnnualValue: optimalSingleCard?.totalAnnualValue || 0,
        netAnnualValue: optimalSingleCard?.netAnnualValue || 0,
        potentialImprovement,
        percentageImprovement
      },
      gapAnalysis: {
        missingCategories,
        suboptimalCategories,
        recommendedAdditions
      }
    }

    console.log(`✅ Portfolio analysis completed for ${user.email}`)

    return NextResponse.json(analysis)

  } catch (error: any) {
    console.error('❌ Portfolio analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze portfolio', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 