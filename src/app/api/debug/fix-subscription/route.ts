import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, isStripeConfigured } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        customerId: true,
        subscriptionId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    let correctedTier = 'free'
    let correctedStatus = 'active'
    let details = 'No Stripe customer or subscription found'

    // Check Stripe if customer ID exists
    if (user.customerId && isStripeConfigured && stripe) {
      try {
        // Check if customer exists in Stripe
        const customer = await stripe.customers.retrieve(user.customerId)
        
        if (customer && !customer.deleted) {
          // Get active subscriptions
          const subscriptions = await stripe.subscriptions.list({
            customer: user.customerId,
            status: 'active',
            limit: 1,
          })

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0]
            correctedTier = 'premium'
            correctedStatus = subscription.status
            details = `Active subscription found: ${subscription.id}`
          } else {
            // Check for trialing subscriptions
            const trialingSubscriptions = await stripe.subscriptions.list({
              customer: user.customerId,
              status: 'trialing',
              limit: 1,
            })

            if (trialingSubscriptions.data.length > 0) {
              const subscription = trialingSubscriptions.data[0]
              correctedTier = 'premium'
              correctedStatus = 'trialing'
              details = `Trialing subscription found: ${subscription.id}`
            } else {
              details = 'Customer exists but no active subscriptions'
            }
          }
        } else {
          details = 'Customer not found in Stripe or deleted'
        }
      } catch (stripeError) {
        details = `Stripe error: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        subscriptionTier: correctedTier,
        subscriptionStatus: correctedStatus,
      },
      select: {
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        customerId: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription tier corrected',
      before: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
      },
      after: {
        tier: updatedUser.subscriptionTier,
        status: updatedUser.subscriptionStatus,
      },
      details,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Fix subscription error:', error)
    return NextResponse.json(
      { error: `Failed to fix subscription: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 