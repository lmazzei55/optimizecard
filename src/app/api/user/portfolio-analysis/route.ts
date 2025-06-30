import { NextRequest, NextResponse } from 'next/server'
import { withRetry, prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
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

    // Check if user has premium access
    const isPremium = user.subscriptionTier === 'premium' && 
                     (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')
    
    if (!isPremium) {
      return NextResponse.json({ 
        error: 'Portfolio analysis is a premium feature. Upgrade to access comprehensive portfolio insights.',
        premiumRequired: true 
      }, { status: 403 })
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

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`📊 Portfolio analysis GET request for ${session.user.email}`)

    // Get user and their spending data with enhanced error handling
    const user = await withRetry(async () => {
      console.log('📊 Fetching user data...')
      try {
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
            },
            spendingCategories: {
              include: {
                category: true
              }
            },
            spendingSubCategories: {
              include: {
                subCategory: {
                  include: {
                    parentCategory: true
                  }
                }
              }
            }
          }
        })
      } catch (error: any) {
        console.error('📊 Database query error:', error.message)
        throw error
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has premium access
    const isPremium = user.subscriptionTier === 'premium' && 
                     (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')
    
    if (!isPremium) {
      return NextResponse.json({ 
        error: 'Portfolio analysis is a premium feature. Upgrade to access comprehensive portfolio insights.',
        premiumRequired: true 
      }, { status: 403 })
    }

    console.log(`📊 User owned cards count: ${user.ownedCards?.length || 0}`)
    if (user.ownedCards && user.ownedCards.length > 0) {
      console.log(`📊 Owned cards:`, user.ownedCards.map(oc => `${oc.card.name} (${oc.card.issuer})`))
      console.log(`📊 Owned cards detailed:`)
      user.ownedCards.forEach(uc => {
        console.log(`  Card: ${uc.card.name}`)
        console.log(`    Category rewards: ${uc.card.categoryRewards?.length || 0}`)
        uc.card.categoryRewards?.forEach(cr => {
          console.log(`      ${cr.category?.name || 'Unknown'}: ${cr.rewardRate}`)
        })
        console.log(`    Base reward: ${uc.card.baseReward}`)
      })
    }
    
    console.log(`📊 DEBUGGING: Starting portfolio analysis calculation...`)

    if (!user.ownedCards || user.ownedCards.length === 0) {
      console.log(`📊 No owned cards found, returning empty portfolio`)
      return NextResponse.json({ 
        portfolio: {
          cards: [],
          totalAnnualFees: 0,
          totalWelcomeBonuses: 0,
          averageRewardRate: 0
        },
        categoryAnalysis: [],
        gaps: [],
        metrics: {
          portfolioScore: 0,
          coverageScore: 0,
          optimizationScore: 0,
          diversificationScore: 0
        }
      })
    }

    // Convert user spending to the format expected by the analysis
    console.log(`📊 User spending categories: ${user.spendingCategories?.length || 0}`)
    user.spendingCategories?.forEach(sc => {
      console.log(`  ${sc.category.name}: $${sc.monthlySpend}/month`)
    })
    
    // Check if user has spending data in JSON format (like recommendations use)
    let userSpending: {
      categoryId: string
      categoryName: string
      monthlySpend: number
      subCategoryId: string | null
      subCategoryName: string | null
    }[] = []

    if (user.spendingCategories && user.spendingCategories.length > 0) {
      // Use relational spending data
      userSpending = user.spendingCategories.map(spending => ({
        categoryId: spending.categoryId,
        categoryName: spending.category.name,
        monthlySpend: spending.monthlySpend,
        subCategoryId: null,
        subCategoryName: null
      }))
    } else if (user.spendingData) {
      // Use JSON spending data (same as recommendations)
      console.log(`📊 Using JSON spending data from user.spendingData`)
      try {
        const spendingData = typeof user.spendingData === 'string' 
          ? JSON.parse(user.spendingData) 
          : user.spendingData
        
        if (Array.isArray(spendingData)) {
          userSpending = spendingData.map((spending: any) => ({
            categoryId: spending.categoryId || spending.id || '',
            categoryName: spending.categoryName || spending.name || '',
            monthlySpend: spending.monthlySpend || spending.amount || 0,
            subCategoryId: null,
            subCategoryName: null
          }))
          console.log(`📊 Converted ${userSpending.length} spending categories from JSON:`)
          userSpending.forEach(s => {
            console.log(`  ${s.categoryName}: $${s.monthlySpend}/month`)
          })
        }
      } catch (error) {
        console.error(`📊 Error parsing spending data:`, error)
      }
    }

    // Add subcategory spending if enabled
    if (user.enableSubCategories && user.spendingSubCategories && Array.isArray(user.spendingSubCategories) && user.spendingSubCategories.length > 0) {
      user.spendingSubCategories.forEach(subSpending => {
        if (subSpending.subCategory && subSpending.subCategory.parentCategory) {
          userSpending.push({
            categoryId: subSpending.subCategory.parentCategoryId,
            categoryName: subSpending.subCategory.parentCategory.name,
            monthlySpend: subSpending.monthlySpend,
            subCategoryId: subSpending.subCategoryId,
            subCategoryName: subSpending.subCategory.name
          })
        }
      })
    }

    if (userSpending.length === 0) {
      return NextResponse.json({ 
        portfolio: {
          cards: user.ownedCards.map(oc => ({
            id: oc.card.id,
            name: oc.card.name,
            issuer: oc.card.issuer,
            annualFee: oc.card.annualFee,
            categoryRewards: {},
            flatReward: oc.card.baseReward,
            welcomeBonus: oc.card.signupBonus ? {
              amount: oc.card.signupBonus,
              spendRequirement: oc.card.signupSpend || 0,
              timeFrame: oc.card.signupTimeframe || 3
            } : undefined
          })),
          totalAnnualFees: user.ownedCards.reduce((sum, oc) => sum + oc.card.annualFee, 0),
          totalWelcomeBonuses: user.ownedCards.reduce((sum, oc) => sum + (oc.card.signupBonus || 0), 0),
          averageRewardRate: 0
        },
        categoryAnalysis: [],
        gaps: [],
        metrics: {
          portfolioScore: 50,
          coverageScore: 0,
          optimizationScore: 100,
          diversificationScore: user.ownedCards.length > 1 ? 75 : 25
        }
      })
    }

    // Get all cards for comparison
    const allCards = await withRetry(async () => {
      return await prisma.creditCard.findMany({
        where: { isActive: true },
        include: {
          categoryRewards: {
            include: {
              category: true,
              subCategory: true
            }
          },
          benefits: true
        }
      })
    })

    // Calculate current portfolio performance
    const ownedCards = user.ownedCards.map(uc => uc.card)
    const ownedCardIds = user.ownedCards.map(uc => uc.cardId)

    // Build category rewards map for each owned card
    const cardCategoryRewards = ownedCards.map(card => {
      const categoryRewards: Record<string, number> = {}
      card.categoryRewards.forEach(cr => {
        if (cr.category) {
          categoryRewards[cr.category.name] = cr.rewardRate
        }
      })
      return {
        card,
        categoryRewards
      }
    })

    // Analyze each spending category
    const categoryAnalysis = userSpending.map(spending => {
      // Find best owned card for this category
      let currentBestCard = ''
      let currentRewardRate = 0
      
      cardCategoryRewards.forEach(({ card, categoryRewards }) => {
        // Use specific category reward if available, otherwise use base reward
        const categoryRate = categoryRewards[spending.categoryName]
        const baseRate = card.baseReward || 0.01
        const rate = categoryRate || baseRate
        
        console.log(`  🔍 Card ${card.name} for ${spending.categoryName}: category rate = ${categoryRate || 'none'}, base rate = ${baseRate}, effective rate = ${rate}`)
        if (rate > currentRewardRate) {
          currentRewardRate = rate
          currentBestCard = card.name
        }
      })

      // If no card was found with rewards, assign the first card with base reward
      if (currentRewardRate === 0 && ownedCards.length > 0) {
        currentBestCard = ownedCards[0].name
        currentRewardRate = ownedCards[0].baseReward || 0.01
        console.log(`  🔄 Fallback: Using ${currentBestCard} with base rate ${currentRewardRate}`)
      }

      console.log(`  📊 Best owned card for ${spending.categoryName}: ${currentBestCard} (${(currentRewardRate * 100).toFixed(1)}%)`)

      // Find potential best card from all cards
      let potentialBestCard = currentBestCard
      let potentialRewardRate = currentRewardRate
      
      allCards.forEach(card => {
        if (!ownedCardIds.includes(card.id)) {
          const categoryReward = card.categoryRewards.find(cr => 
            cr.category && cr.category.name === spending.categoryName
          )
          const rate = categoryReward ? categoryReward.rewardRate : (card.baseReward || 0.01)
          if (rate > potentialRewardRate) {
            potentialRewardRate = rate
            potentialBestCard = card.name
          }
        }
      })

      return {
        category: spending.categoryName,
        currentBestCard,
        currentRewardRate,
        potentialBestCard,
        potentialRewardRate,
        improvementPotential: potentialRewardRate - currentRewardRate
      }
    })

    // Find gaps (categories with significant improvement potential)
    const gaps = categoryAnalysis
      .filter(ca => ca.improvementPotential > 0.5) // More than 0.5% improvement
      .map(ca => {
        const recommendedCard = allCards.find(c => c.name === ca.potentialBestCard)
        const spending = userSpending.find(s => s.categoryName === ca.category)
        const monthlySpend = spending?.monthlySpend || 0
        const currentReward = monthlySpend * 12 * (ca.currentRewardRate / 100)
        const potentialReward = monthlySpend * 12 * (ca.potentialRewardRate / 100)
        const annualFee = recommendedCard?.annualFee || 0
        
        return {
          category: ca.category,
          currentCoverage: ca.currentRewardRate,
          recommendedCard: ca.potentialBestCard,
          potentialReward,
          annualFee,
          netBenefit: potentialReward - currentReward - annualFee
        }
      })
      .filter(gap => gap.netBenefit > 0) // Only show gaps with positive net benefit

    // Calculate portfolio metrics
    const totalSpend = userSpending.reduce((sum, s) => sum + s.monthlySpend * 12, 0)
    const currentRewards = categoryAnalysis.reduce((sum, ca) => {
      const spending = userSpending.find(s => s.categoryName === ca.category)
      return sum + (spending?.monthlySpend || 0) * 12 * (ca.currentRewardRate / 100)
    }, 0)
    const potentialRewards = categoryAnalysis.reduce((sum, ca) => {
      const spending = userSpending.find(s => s.categoryName === ca.category)
      return sum + (spending?.monthlySpend || 0) * 12 * (ca.potentialRewardRate / 100)
    }, 0)

    const portfolioScore = potentialRewards === 0 ? 0 : Math.min(100, Math.round((currentRewards / potentialRewards) * 100))
    
    // Debug coverage calculation
    console.log(`📊 Coverage calculation - Raw category analysis:`)
    categoryAnalysis.forEach(ca => {
      console.log(`  ${ca.category}: currentRewardRate = ${ca.currentRewardRate}, currentBestCard = ${ca.currentBestCard}`)
    })
    
    const categoriesWithRewards = categoryAnalysis.filter(ca => ca.currentRewardRate > 0) // Any reward rate above 0
    console.log(`📊 Coverage calculation:`)
    console.log(`  Total categories: ${categoryAnalysis.length}`)
    console.log(`  Categories with rewards: ${categoriesWithRewards.length}`)
    console.log(`  Categories with rewards:`, categoriesWithRewards.map(ca => `${ca.category}: ${(ca.currentRewardRate * 100).toFixed(1)}%`))
    
    const coverageScore = categoryAnalysis.length === 0 ? 0 : 
      Math.round((categoriesWithRewards.length / categoryAnalysis.length) * 100)
    
    console.log(`  Coverage score: ${coverageScore}%`)
    
    const optimizedCategories = categoryAnalysis.filter(ca => ca.improvementPotential < 0.001)
    const optimizationScore = Math.round((optimizedCategories.length / categoryAnalysis.length) * 100)
    console.log(`📊 Optimization calculation:`)
    console.log(`  Optimized categories: ${optimizedCategories.length}/${categoryAnalysis.length}`)
    console.log(`  Optimization score: ${optimizationScore}%`)
    
    // Calculate diversification based on unique issuers
    const uniqueIssuers = new Set(ownedCards.map(card => card.issuer))
    const diversificationScore = Math.min(100, Math.round((uniqueIssuers.size / 3) * 100))
    console.log(`📊 Diversification calculation:`)
    console.log(`  Unique issuers: ${uniqueIssuers.size} (${Array.from(uniqueIssuers).join(', ')})`)
    console.log(`  Diversification score: ${diversificationScore}%`)
    
    // Add debugging for the actual response
    console.log(`📊 FINAL PORTFOLIO RESPONSE:`)
    console.log(`  Portfolio cards: ${ownedCards.length}`)
    console.log(`  Coverage: ${coverageScore}%`)
    console.log(`  Optimization: ${optimizationScore}%`) 
    console.log(`  Diversification: ${diversificationScore}%`)

    // Build the response in the format expected by the component
    const response = {
      portfolio: {
        cards: ownedCards.map(card => ({
          id: card.id,
          name: card.name,
          issuer: card.issuer,
          annualFee: card.annualFee,
          categoryRewards: cardCategoryRewards.find(ccr => ccr.card.id === card.id)?.categoryRewards || {},
          flatReward: card.baseReward,
          welcomeBonus: card.signupBonus ? {
            amount: card.signupBonus,
            spendRequirement: card.signupSpend || 0,
            timeFrame: card.signupTimeframe || 3
          } : undefined
        })),
        totalAnnualFees: ownedCards.reduce((sum, card) => sum + card.annualFee, 0),
        totalWelcomeBonuses: ownedCards.reduce((sum, card) => sum + (card.signupBonus || 0), 0),
        averageRewardRate: totalSpend > 0 ? (currentRewards / totalSpend * 100) : 0
      },
      categoryAnalysis,
      gaps,
      metrics: {
        portfolioScore,
        coverageScore,
        optimizationScore,
        diversificationScore
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Portfolio analysis GET error:', error)
    
    // Return a fallback response instead of 500 error
    const fallbackResponse = {
      portfolio: {
        cards: [],
        totalAnnualFees: 0,
        totalWelcomeBonuses: 0,
        averageRewardRate: 0
      },
      categoryAnalysis: [],
      gaps: [],
      metrics: {
        portfolioScore: 0,
        coverageScore: 0,
        optimizationScore: 0,
        diversificationScore: 0
      },
      error: 'Portfolio analysis temporarily unavailable - showing cached data'
    }
    
    return NextResponse.json(fallbackResponse, { 
      status: 200, // Return 200 instead of 500 so the component can handle it
      headers: { 'X-Fallback-Data': 'true' }
    })
  }
} 