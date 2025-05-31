import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        message: 'No customer ID found',
        subscriptionTier: 'free'
      })
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
      status: 'active',
      limit: 1,
    })

    let subscriptionTier = 'free'
    let subscriptionStatus = 'active'
    let subscriptionId = null
    let subscriptionStartDate = null
    let subscriptionEndDate = null

    if (subscriptions.data.length > 0) {
      const activeSubscription = subscriptions.data[0]
      subscriptionTier = 'premium'
      subscriptionStatus = activeSubscription.status
      subscriptionId = activeSubscription.id
      
      // Cast to any to access period properties
      const sub = activeSubscription as any
      subscriptionStartDate = sub.current_period_start 
        ? new Date(sub.current_period_start * 1000) 
        : null
      subscriptionEndDate = sub.current_period_end 
        ? new Date(sub.current_period_end * 1000) 
        : null

      // Update user in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier,
          subscriptionStatus,
          subscriptionId,
          subscriptionStartDate,
          subscriptionEndDate,
        },
      })
    } else {
      // No active subscription, ensure user is set to free
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          subscriptionId: null,
        },
      })
    }

    return NextResponse.json({ 
      success: true, 
      subscriptionTier,
      subscriptionStatus,
      message: `Subscription verified and synced: ${subscriptionTier}`
    })
  } catch (error) {
    console.error('Error verifying subscription:', error)
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    )
  }
} 