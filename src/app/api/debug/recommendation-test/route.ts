import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET() {
  try {
    // Test the same query that the recommendation engine uses
    const whereClause = { 
      isActive: true,
      rewardType: 'cashback',
      tier: 'free'
    }
    
    console.log('🔍 Testing recommendation engine query with whereClause:', whereClause)
    
    let cards: any[] = []
    let note: string | null = null
    
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
      console.log(`✅ Found ${cards.length} cards matching criteria`)
    } catch (error: any) {
      // Handle prepared statement conflicts gracefully
      if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
        console.log('⚠️ Prepared statement conflict in recommendation test, but database is working')
        cards = []
        note = 'Prepared statement conflicts detected - database is working but operations limited in serverless'
      } else {
        throw error // Re-throw other errors
      }
    }
    
    return NextResponse.json({
      whereClause,
      cardCount: cards.length,
      cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        tier: card.tier,
        rewardType: card.rewardType,
        isActive: card.isActive,
        categoryRewardsCount: card.categoryRewards.length
      })),
      note,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Recommendation test error:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 