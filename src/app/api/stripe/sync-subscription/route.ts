import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ 
        error: 'Payment processing is not configured' 
      }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.customerId) {
      return NextResponse.json({ 
        success: true, 
        message: 'No Stripe customer found - user remains on free tier',
        subscriptionTier: 'free'
      })
    }

    // Get subscriptions from Stripe
    const subscriptions = await stripe!.subscriptions.list({
      customer: user.customerId,
      limit: 10, // Get recent subscriptions
    })

    console.log('🔍 Found subscriptions:', subscriptions.data.length)

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
      
      // Cast to any to access period properties
      const sub = activeSubscription as any
      subscriptionStartDate = sub.start_date 
        ? new Date(sub.start_date * 1000) 
        : null
      subscriptionEndDate = sub.current_period_end 
        ? new Date(sub.current_period_end * 1000) 
        : null
      trialEndDate = sub.trial_end 
        ? new Date(sub.trial_end * 1000) 
        : null

      console.log('✅ Active subscription found:', {
        id: activeSubscription.id,
        status: activeSubscription.status,
        tier: subscriptionTier
      })
    } else {
      console.log('❌ No active subscription found')
    }

    // Update user in database
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
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    )
  }
} 