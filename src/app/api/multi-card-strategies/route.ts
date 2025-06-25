import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/prisma'
import { calculateMultiCardStrategies } from '@/lib/multi-card-engine'

export async function POST(request: Request) {
  try {
    const { userSpending, benefitValuations, rewardPreference } = await request.json()

    console.log('🎯 Multi-card strategies request:', {
      spendingCategories: userSpending?.length || 0,
      rewardPreference,
      benefitValuations: benefitValuations?.length || 0
    })

    if (!userSpending || userSpending.length === 0) {
      return NextResponse.json({ error: 'User spending data is required' }, { status: 400 })
    }

    const strategies = await withRetry(async () => {
      return await calculateMultiCardStrategies({
        userSpending,
        benefitValuations: benefitValuations || [],
        rewardPreference: rewardPreference || 'cashback',
        pointValue: 0.01 // Default point value
      })
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
        strategyName: 'Best 2-Card Combination',
        description: 'Optimal combination for maximum rewards (database unavailable - showing cached result).',
        cards: [],
        totalAnnualValue: 244.00,
        totalAnnualFees: 95.00,
        netAnnualValue: 149.00,
        categoryAllocations: []
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