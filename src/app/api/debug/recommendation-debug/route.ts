import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userSpending, rewardPreference = 'cashback', subscriptionTier = 'free' } = body

    console.log('🔍 Debug: Starting recommendation debug with:', {
      userSpending,
      rewardPreference,
      subscriptionTier
    })

    // Step 1: Build where clause
    let whereClause: any = { 
      isActive: true
    }
    
    if (rewardPreference === 'cashback') {
      whereClause.rewardType = 'cashback'
    } else if (rewardPreference === 'points') {
      whereClause.rewardType = 'points'
    }
    
    if (subscriptionTier === 'free') {
      whereClause.tier = 'free'
    }

    console.log('🔍 Debug: Where clause:', whereClause)

    // Step 2: Query cards
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
      console.log(`🔍 Debug: Found ${cards.length} cards`)
    } catch (error: any) {
      console.log('🔍 Debug: Error querying cards:', error.message)
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message,
        step: 'card_query'
      }, { status: 500 })
    }

    // Step 3: Analyze each card
    const cardAnalysis = []
    for (const card of cards) {
      const analysis = {
        cardId: card.id,
        cardName: card.name,
        tier: card.tier,
        rewardType: card.rewardType,
        isActive: card.isActive,
        baseReward: card.baseReward,
        categoryRewardsCount: card.categoryRewards.length,
        categoryRewards: card.categoryRewards.map((cr: any) => ({
          id: cr.id,
          categoryId: cr.categoryId,
          subCategoryId: cr.subCategoryId,
          categoryName: cr.category?.name,
          subCategoryName: cr.subCategory?.name,
          rewardRate: cr.rewardRate,
          maxReward: cr.maxReward,
          period: cr.period
        })),
        benefitsCount: card.benefits.length,
        calculatedValue: 0
      }

      // Step 4: Calculate value for this card
      let totalValue = 0
      for (const spending of userSpending) {
        console.log(`🔍 Debug: Processing spending for ${spending.categoryName} ($${spending.monthlySpend})`)
        
        // Find matching reward
        let categoryReward = null
        
        if (spending.subCategoryId) {
          categoryReward = card.categoryRewards.find(
            (reward: any) => reward.subCategoryId === spending.subCategoryId
          )
        }
        
        if (!categoryReward && spending.categoryId) {
          categoryReward = card.categoryRewards.find(
            (reward: any) => reward.categoryId === spending.categoryId
          )
        }

        const rewardRate = categoryReward?.rewardRate || card.baseReward
        const monthlyValue = spending.monthlySpend * rewardRate
        const annualValue = monthlyValue * 12
        totalValue += annualValue

        console.log(`🔍 Debug: ${card.name} - ${spending.categoryName}: ${rewardRate * 100}% = $${monthlyValue.toFixed(2)}/month`)
      }

      analysis.calculatedValue = totalValue
      cardAnalysis.push(analysis)
    }

    // Step 5: Check categories in database
    const categories = await prisma.spendingCategory.findMany({
      include: {
        subCategories: true
      }
    })

    return NextResponse.json({
      success: true,
      debug: {
        whereClause,
        cardsFound: cards.length,
        userSpending,
        cardAnalysis,
        availableCategories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          subCategories: cat.subCategories.map(sub => ({
            id: sub.id,
            name: sub.name
          }))
        }))
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 