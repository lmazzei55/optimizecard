import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withRetry, prisma } from '@/lib/prisma'
import { calculateMultiCardStrategies } from '@/lib/multi-card-engine'

export async function POST(request: Request) {
  try {
    const { userSpending, benefitValuations, rewardPreference, calculationPreferences } = await request.json()

    console.log('🎯 Multi-card strategies request:', {
      spendingCategories: userSpending?.length || 0,
      rewardPreference,
      benefitValuations: benefitValuations?.length || 0,
      calculationPreferences
    })

    if (!userSpending || userSpending.length === 0) {
      return NextResponse.json({ error: 'User spending data is required' }, { status: 400 })
    }

    // Get user session to get their preferences
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's actual preferences
    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          rewardPreference: true,
          pointValue: true,
          subscriptionTier: true,
          subscriptionStatus: true
        }
      })
    })

    // Check if user has premium access
    const isPremium = user?.subscriptionTier === 'premium' && 
                     (user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing')
    
    if (!isPremium) {
      return NextResponse.json({ 
        error: 'Multi-card strategies are a premium feature. Upgrade to access advanced optimization tools.',
        premiumRequired: true 
      }, { status: 403 })
    }

    const strategies = await withRetry(async () => {
      console.log('🔧 DEBUGGING: API route about to call calculateMultiCardStrategies with options:')
      console.log(`  userSpending categories: ${userSpending.length}`)
      console.log(`  rewardPreference: ${rewardPreference || user?.rewardPreference || 'best_overall'}`)
      console.log(`  pointValue: ${user?.pointValue || 0.01}`)
      console.log(`  subscriptionTier: ${user?.subscriptionTier || 'free'}`)
      
      return await calculateMultiCardStrategies({
        userSpending,
        benefitValuations: benefitValuations || [],
        rewardPreference: rewardPreference || user?.rewardPreference || 'best_overall',
        pointValue: user?.pointValue || 0.01,
        subscriptionTier: user?.subscriptionTier as 'free' | 'premium' || 'free',
        calculationPreferences: calculationPreferences || {
          includeAnnualFees: true,
          includeBenefits: true,
          includeSignupBonuses: true,
          calculationMode: 'comprehensive'
        }
      })
    })

    console.log(`✅ Multi-card strategies generated: ${strategies.length} strategies`)
    
    // Debug the first strategy's category allocations
    if (strategies.length > 0 && strategies[0].categoryAllocations.length > 0) {
      console.log('🔧 DEBUGGING: First strategy category allocations:')
      strategies[0].categoryAllocations.forEach((allocation, index) => {
        console.log(`  ${index}: ${allocation.categoryName} - ${allocation.bestCard} - Annual: $${allocation.annualValue}`)
      })
    }

    return NextResponse.json({
      success: true,
      strategies: strategies
    })

  } catch (error: any) {
    console.error('❌ Multi-card strategies API Error:', error)
    
    // Return 503 for database connection issues with retry suggestion
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      console.error('Database connection pool issue detected')
      
      return NextResponse.json({
        error: 'Database temporarily unavailable. Please try again in a moment.',
        retryable: true
      }, { status: 503 })
    }
    
    return NextResponse.json(
      { error: 'Failed to generate strategies', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 