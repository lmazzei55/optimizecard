import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userSpending, rewardPreference = 'cashback' } = body

    console.log('🔍 Simple recommendations with:', { userSpending, rewardPreference })

    // Build where clause
    let whereClause: any = { 
      isActive: true,
      tier: 'free' // Free tier only for now
    }
    
    if (rewardPreference === 'cashback') {
      whereClause.rewardType = 'cashback'
    } else if (rewardPreference === 'points') {
      whereClause.rewardType = 'points'
    }

    // Get cards with a simple approach - no complex includes
    let cards: any[] = []
    
    // First, get basic card info
    const basicCards = await prisma.creditCard.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        issuer: true,
        annualFee: true,
        rewardType: true,
        baseReward: true,
        applicationUrl: true
      }
    })

    console.log(`📋 Found ${basicCards.length} basic cards`)

    // Then get category rewards separately to avoid prepared statement conflicts
    const recommendations = []
    
    for (const card of basicCards) {
      try {
        // Get category rewards for this card
        const categoryRewards = await prisma.categoryReward.findMany({
          where: { cardId: card.id },
          include: {
            category: true,
            subCategory: true
          }
        })

        // Get benefits for this card
        const benefits = await prisma.cardBenefit.findMany({
          where: { cardId: card.id }
        })

        // Calculate value for user spending
        let totalAnnualValue = 0
        const categoryBreakdown = []

        for (const spending of userSpending) {
          if (spending.monthlySpend <= 0) continue

          // Find matching reward
          let bestReward = null
          let rewardRate = card.baseReward

          // Look for category-specific rewards
          for (const reward of categoryRewards) {
            if (reward.category?.name === spending.categoryName) {
              if (!bestReward || reward.rewardRate > bestReward.rewardRate) {
                bestReward = reward
                rewardRate = reward.rewardRate
              }
            }
          }

          const monthlyValue = spending.monthlySpend * rewardRate
          const annualValue = monthlyValue * 12
          totalAnnualValue += annualValue

          categoryBreakdown.push({
            categoryName: spending.categoryName,
            monthlySpend: spending.monthlySpend,
            rewardRate: rewardRate,
            monthlyValue: monthlyValue,
            annualValue: annualValue
          })
        }

        // Calculate benefits value
        const benefitsValue = benefits.reduce((sum, benefit) => sum + benefit.annualValue, 0)
        const netAnnualValue = totalAnnualValue + benefitsValue - card.annualFee

        recommendations.push({
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
          benefitsBreakdown: benefits.map(benefit => ({
            benefitName: benefit.name,
            officialValue: benefit.annualValue,
            personalValue: benefit.annualValue,
            category: benefit.category
          }))
        })

        console.log(`✅ ${card.name}: $${netAnnualValue.toFixed(2)} net value`)

      } catch (cardError: any) {
        console.log(`⚠️ Error processing ${card.name}:`, cardError.message)
        // Continue with other cards
      }
    }

    // Sort by net annual value
    recommendations.sort((a, b) => b.netAnnualValue - a.netAnnualValue)

    console.log(`🎉 Returning ${recommendations.length} recommendations`)

    return NextResponse.json(recommendations)

  } catch (error: any) {
    console.error('❌ Simple recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate recommendations', details: error.message },
      { status: 500 }
    )
  }
} 