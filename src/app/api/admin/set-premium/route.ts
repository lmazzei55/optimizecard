import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Set premium request started')
    
    const session = await auth()
    if (!session?.user?.email) {
      console.error('❌ User not authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.email)

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}))
    const { 
      customerId = 'cus_SaZ77hiO8Yy1EN', // From Stripe dashboard
      subscriptionId = 'sub_1RfJZXAszQW9oKUc5xNCt4Tq', // Example ID
      trialEndDate = '2025-07-07T23:59:59.000Z' // July 7th trial end
    } = body

    console.log('💾 Setting premium status for user:', session.user.email)
    console.log('📋 Premium details:', {
      customerId,
      subscriptionId,
      trialEndDate
    })

    // Update user to premium with trial
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'trialing',
        customerId: customerId,
        subscriptionId: subscriptionId,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date('2025-07-07T23:59:59.000Z'), // Trial period end
        trialEndDate: new Date(trialEndDate),
      },
    })

    console.log('✅ User updated to premium successfully')

    return NextResponse.json({ 
      success: true,
      message: 'User upgraded to premium successfully',
      user: {
        email: updatedUser.email,
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
        trialEndDate: updatedUser.trialEndDate,
        customerId: updatedUser.customerId
      }
    })
  } catch (error) {
    console.error('❌ Error setting premium status:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to set premium status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 