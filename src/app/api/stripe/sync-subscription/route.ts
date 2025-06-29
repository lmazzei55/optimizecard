import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Sync subscription request started')
    
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      console.error('❌ Stripe not configured')
      return NextResponse.json({ 
        error: 'Payment processing is not configured' 
      }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.email) {
      console.error('❌ User not authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.email)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        customerId: true,
        subscriptionTier: true 
      }
    })

    if (!user) {
      console.error('❌ User not found in database:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ User found:', { id: user.id, customerId: user.customerId, currentTier: user.subscriptionTier })

    if (!user.customerId) {
      console.log('⚠️ No Stripe customer ID found for user')
      return NextResponse.json({ 
        success: true, 
        message: 'No Stripe customer found - user remains on free tier',
        subscriptionTier: 'free'
      })
    }

    // Get subscriptions from Stripe
    console.log('🔍 Fetching subscriptions from Stripe for customer:', user.customerId)
    const subscriptions = await stripe!.subscriptions.list({
      customer: user.customerId,
      limit: 10, // Get recent subscriptions
    })

    console.log('🔍 Found subscriptions:', subscriptions.data.length)
    console.log('📋 Subscription details:', subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      created: new Date(sub.created * 1000).toISOString(),
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
    })))

    let subscriptionTier = 'free'
    let subscriptionStatus = 'active'
    let subscriptionId = null
    let subscriptionStartDate = null
    let subscriptionEndDate = null
    let trialEndDate = null

    // Check for active or trialing subscriptions
    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    )

    if (activeSubscription) {
      subscriptionTier = 'premium'
      subscriptionStatus = activeSubscription.status
      subscriptionId = activeSubscription.id
      
      subscriptionStartDate = activeSubscription.start_date 
        ? new Date(activeSubscription.start_date * 1000) 
        : null
      subscriptionEndDate = (activeSubscription as any).current_period_end 
        ? new Date((activeSubscription as any).current_period_end * 1000) 
        : null
      trialEndDate = activeSubscription.trial_end 
        ? new Date(activeSubscription.trial_end * 1000) 
        : null

      console.log('✅ Active subscription found:', {
        id: activeSubscription.id,
        status: activeSubscription.status,
        tier: subscriptionTier,
        trialEnd: trialEndDate?.toISOString()
      })
    } else {
      console.log('❌ No active subscription found')
    }

    // Update user in database
    console.log('💾 Updating user in database with:', {
      subscriptionTier,
      subscriptionStatus,
      subscriptionId,
      subscriptionStartDate: subscriptionStartDate?.toISOString(),
      subscriptionEndDate: subscriptionEndDate?.toISOString(),
      trialEndDate: trialEndDate?.toISOString()
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier,
        subscriptionStatus,
        subscriptionId,
        subscriptionStartDate,
        subscriptionEndDate,
        trialEndDate,
      },
    })

    console.log('✅ User updated successfully')

    return NextResponse.json({ 
      success: true, 
      subscriptionTier,
      subscriptionStatus,
      subscriptionId,
      message: `Subscription synced: ${subscriptionTier} (${subscriptionStatus})`,
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000).toISOString()
      })),
      synced: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error syncing subscription:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to sync subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 