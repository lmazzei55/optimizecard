import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test with categoryRewards included
    const cards = await prisma.creditCard.findMany({
      where: {
        isActive: true,
        rewardType: 'cashback',
        tier: 'free'
      },
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

    return NextResponse.json({
      success: true,
      cardsFound: cards.length,
      cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        tier: card.tier,
        rewardType: card.rewardType,
        categoryRewardsCount: card.categoryRewards.length,
        categoryRewards: card.categoryRewards.map(cr => ({
          id: cr.id,
          categoryId: cr.categoryId,
          subCategoryId: cr.subCategoryId,
          rewardRate: cr.rewardRate,
          maxReward: cr.maxReward,
          period: cr.period,
          categoryName: cr.category?.name,
          subCategoryName: cr.subCategory?.name
        }))
      })),
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Simple test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 