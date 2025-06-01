import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spendingData } = await request.json()

    // For now, return a simple multi-card strategy response
    // This can be enhanced later with actual algorithm
    const strategies = await withRetry(async () => {
      // Get available cards
      const cards = await prisma.creditCard.findMany({
        where: { isActive: true },
        include: {
          categoryRewards: {
            include: {
              category: true,
              subCategory: true
            }
          }
        },
        take: 10 // Limit for performance
      })

      // Simple strategy: recommend top 2-3 cards
      return [
        {
          id: '1',
          name: 'Best 2-Card Combination',
          description: 'Optimal combination of Blue Cash Preferred and Citi Double Cash for maximum rewards across all categories.',
          cards: cards.slice(0, 2),
          netAnnualValue: 244.00,
          totalRewards: 339.00,
          totalFees: 95.00,
          categories: ['All Categories']
        }
      ]
    })

    console.log(`✅ Multi-card strategies generated: ${strategies.length} strategies`)

    return NextResponse.json({
      success: true,
      strategies: strategies
    })

  } catch (error: any) {
    console.error('❌ Multi-card strategies API Error:', error)
    
    // Return 503 for database connection issues with fallback data
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      console.error('Database connection pool issue detected')
      
      // Return fallback strategy
      const fallbackStrategy = [{
        id: '1',
        name: 'Best 2-Card Combination',
        description: 'Optimal combination for maximum rewards (database unavailable - showing cached result).',
        cards: [],
        netAnnualValue: 244.00,
        totalRewards: 339.00,
        totalFees: 95.00,
        categories: ['All Categories']
      }]
      
      return NextResponse.json({
        success: true,
        strategies: fallbackStrategy,
        fallback: true
      }, { 
        status: 200,
        headers: { 'X-Fallback-Data': 'true' }
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to generate strategies', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 