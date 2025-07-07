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
      let user = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: {
            subscriptionTier: true,
            subscriptionStatus: true,
            customerId: true,
            subscriptionStartDate: true,
            subscriptionEndDate: true,
            trialEndDate: true,
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
              customerId: true,
              subscriptionStartDate: true,
              subscriptionEndDate: true,
              trialEndDate: true,
            },
          })
        })

        console.log('✅ Created new user with free tier:', session.user.email)
        user = newUser
      }

      // Check for active Stripe subscription
      let hasActiveSubscription = false
      let subscriptionDetails = null

      if (stripe) {
        try {
          console.log('🔍 Checking Stripe subscriptions for:', session.user.email)
          const customers = await stripe.customers.list({
            email: session.user.email,
            limit: 1
          })

          if (customers.data.length > 0) {
            const customer = customers.data[0]
            console.log('✅ Found Stripe customer:', customer.id)
            
            const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'active',
              limit: 1
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
          }
        } catch (stripeError) {
          console.error('⚠️ Stripe API error (continuing with database check):', stripeError)
        }
      }

      // SPECIAL CASE: For the main admin user (optimizecard@gmail.com), always set as premium
      const isAdminUser = session.user.email === 'optimizecard@gmail.com'
      
      // Determine final subscription tier
      let finalTier = 'free'
      let finalStatus = 'inactive'
      
      if (isAdminUser) {
        finalTier = 'premium'
        finalStatus = 'active'
        console.log('👑 Admin user detected, setting as premium:', session.user.email)
      } else if (hasActiveSubscription) {
        finalTier = 'premium'
        finalStatus = 'active'
        console.log('💳 Active subscription found, upgrading to premium:', session.user.email)
      } else {
        console.log('📋 No active subscription found, keeping as free tier:', session.user.email)
      }

      // Update user if tier or status changed
      if (user && (user.subscriptionTier !== finalTier || user.subscriptionStatus !== finalStatus)) {
        console.log(`🔄 Updating subscription: ${user.subscriptionTier} -> ${finalTier}, ${user.subscriptionStatus} -> ${finalStatus}`)
        
        user = await withRetry(async () => {
          return await prisma.user.update({
            where: { email: session.user.email! },
            data: {
              subscriptionTier: finalTier,
              subscriptionStatus: finalStatus,
              ...(subscriptionDetails && {
                subscriptionStartDate: subscriptionDetails.trialEnd || new Date(),
                subscriptionEndDate: subscriptionDetails.currentPeriodEnd,
                trialEndDate: subscriptionDetails.trialEnd,
              })
            },
            select: {
              subscriptionTier: true,
              subscriptionStatus: true,
              customerId: true,
              subscriptionStartDate: true,
              subscriptionEndDate: true,
              trialEndDate: true,
            }
          })
        })
        console.log('✅ Subscription status updated successfully')
      }

      if (!user) {
        throw new Error('Failed to create or retrieve user')
      }

      return NextResponse.json({
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        trialEndDate: user.trialEndDate,
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