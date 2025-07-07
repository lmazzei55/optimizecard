import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { withRetry } from '@/lib/prisma'
import { stripe, isStripeConfigured } from '@/lib/stripe'

// GET /api/user/subscription - Get user's subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        tier: 'free',
        status: 'active',
        fallback: false
      })
    }

    try {
      // Get user subscription from database
      const user = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: {
            subscriptionTier: true,
            subscriptionStatus: true,
            subscriptionStartDate: true,
            subscriptionEndDate: true,
            trialEndDate: true,
            customerId: true,
          }
        })
      })

      if (!user) {
        // User doesn't exist, create them with free tier (default)
        const newUser = await withRetry(async () => {
          return await prisma.user.create({
            data: {
              email: session.user.email!,
              name: session.user.name || session.user.email!.split('@')[0],
              subscriptionTier: 'free', // Start as free tier
              subscriptionStatus: 'inactive',
              rewardPreference: 'cashback',
              pointValue: 0.01,
              enableSubCategories: false,
            },
            select: {
              subscriptionTier: true,
              subscriptionStatus: true,
              subscriptionStartDate: true,
              subscriptionEndDate: true,
              trialEndDate: true,
            },
          })
        })

        console.log('✅ Created new user with free tier:', newUser)
        return NextResponse.json(newUser)
      }

      // Check if user has an active Stripe subscription
      let hasActiveSubscription = false
      let subscriptionDetails = null

      if (user.customerId && stripe) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: user.customerId,
            status: 'active',
            limit: 1,
          })

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0]
            hasActiveSubscription = true
            subscriptionDetails = {
              status: subscription.status,
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            }
            console.log('✅ Found active Stripe subscription:', subscription.id)
          }
        } catch (stripeError) {
          console.warn('⚠️ Error checking Stripe subscription:', stripeError)
          // Continue with database-only check
        }
      }

      // Determine final subscription tier
      let finalTier = 'free'
      let finalStatus = 'inactive'
      
      if (hasActiveSubscription) {
        finalTier = 'premium'
        finalStatus = 'active'
      } else if (user.subscriptionTier === 'premium' && user.subscriptionStatus === 'active') {
        // Keep existing premium status if no Stripe check possible
        finalTier = 'premium'
        finalStatus = 'active'
      }

      // Update user if subscription status changed
      if (user.subscriptionTier !== finalTier || user.subscriptionStatus !== finalStatus) {
        const updatedUser = await withRetry(async () => {
          return await prisma.user.update({
            where: { email: session.user.email! },
            data: {
              subscriptionTier: finalTier,
              subscriptionStatus: finalStatus,
              subscriptionStartDate: subscriptionDetails?.trialEnd || subscriptionDetails?.currentPeriodEnd || user.subscriptionStartDate,
              subscriptionEndDate: subscriptionDetails?.currentPeriodEnd || user.subscriptionEndDate,
              trialEndDate: subscriptionDetails?.trialEnd || user.trialEndDate,
            },
            select: {
              subscriptionTier: true,
              subscriptionStatus: true,
              subscriptionStartDate: true,
              subscriptionEndDate: true,
              trialEndDate: true,
            },
          })
        })
        
        console.log(`✅ Updated user subscription: ${user.subscriptionTier} -> ${finalTier}`)
        return NextResponse.json(updatedUser)
      }

      return NextResponse.json({
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        trialEndDate: user.trialEndDate,
        customerId: user.customerId,
        fallback: false,
        recentlyVerified: false
      })

    } catch (dbError) {
      console.error('Database error in subscription fetch:', dbError)
      
      // Database fallback - return basic free tier
      return NextResponse.json({
        tier: 'free',
        status: 'active',
        fallback: true,
        error: 'Database temporarily unavailable'
      })
    }

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json({
      tier: 'free',
      status: 'active',
      fallback: true,
      error: 'Service temporarily unavailable'
    })
  }
}

// POST /api/user/subscription - Update subscription (for webhook/admin use)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      subscriptionTier, 
      subscriptionStatus, 
      subscriptionId, 
      customerId,
      subscriptionStartDate,
      subscriptionEndDate,
      trialEndDate 
    } = body

    // Validate tier
    if (subscriptionTier && !['free', 'premium'].includes(subscriptionTier)) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
    }

    // Validate status
    if (subscriptionStatus && !['active', 'canceled', 'past_due'].includes(subscriptionStatus)) {
      return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 })
    }

    const updatedUser = await withRetry(async () => {
      return await prisma.user.update({
        where: { email: session.user.email! },
        data: {
          ...(subscriptionTier && { subscriptionTier }),
          ...(subscriptionStatus && { subscriptionStatus }),
          ...(subscriptionId && { subscriptionId }),
          ...(customerId && { customerId }),
          ...(subscriptionStartDate && { subscriptionStartDate: new Date(subscriptionStartDate) }),
          ...(subscriptionEndDate && { subscriptionEndDate: new Date(subscriptionEndDate) }),
          ...(trialEndDate && { trialEndDate: new Date(trialEndDate) }),
        },
        select: {
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          trialEndDate: true,
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error: any) {
    console.error("❌ Subscription Update Error:", error)
    
    // Return 503 for database connection issues
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    )
  }
} 