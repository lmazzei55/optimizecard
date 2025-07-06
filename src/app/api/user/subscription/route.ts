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
        // User doesn't exist, create them with free tier
        const newUser = await withRetry(async () => {
          return await prisma.user.create({
            data: {
              email: session.user.email!,
              name: session.user.name || session.user.email!.split('@')[0],
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
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
              customerId: true,
            }
          })
        })

        return NextResponse.json({
          tier: newUser.subscriptionTier,
          status: newUser.subscriptionStatus,
          subscriptionStartDate: newUser.subscriptionStartDate,
          subscriptionEndDate: newUser.subscriptionEndDate,
          trialEndDate: newUser.trialEndDate,
          customerId: newUser.customerId,
          fallback: false,
          recentlyVerified: false
        })
      }

      // If user shows as free tier and we have Stripe configured, do a quick verification
      // This prevents the issue where webhooks fail but user has active subscription
      if (user.subscriptionTier === 'free' && isStripeConfigured && stripe) {
        console.log('🔍 Free tier user detected, checking for active Stripe subscription...')
        
        try {
          // Check if user has a customer ID or find them by email
          let customerId = user.customerId
          
          if (!customerId) {
            const customers = await stripe.customers.list({
              email: session.user.email,
              limit: 1
            })
            
            if (customers.data.length > 0) {
              customerId = customers.data[0].id
            }
          }
          
          if (customerId) {
            // Check for active subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: 'active',
              limit: 1
            })
            
            if (subscriptions.data.length > 0) {
              const activeSubscription = subscriptions.data[0]
              console.log('🎯 Found active subscription for free-tier user, upgrading...')
              
              // Update database to premium
              await withRetry(async () => {
                await prisma.user.update({
                  where: { email: session.user.email! },
                  data: {
                    subscriptionTier: 'premium',
                    subscriptionStatus: activeSubscription.status,
                    subscriptionId: activeSubscription.id,
                    customerId: customerId,
                    subscriptionStartDate: new Date(activeSubscription.start_date * 1000),
                    subscriptionEndDate: (activeSubscription as any).current_period_end 
                      ? new Date((activeSubscription as any).current_period_end * 1000) 
                      : null,
                    trialEndDate: activeSubscription.trial_end 
                      ? new Date(activeSubscription.trial_end * 1000) 
                      : null,
                  }
                })
              })
              
              console.log('✅ User upgraded to premium automatically')
              
              return NextResponse.json({
                tier: 'premium',
                status: activeSubscription.status,
                subscriptionStartDate: new Date(activeSubscription.start_date * 1000),
                subscriptionEndDate: (activeSubscription as any).current_period_end 
                  ? new Date((activeSubscription as any).current_period_end * 1000) 
                  : null,
                trialEndDate: activeSubscription.trial_end 
                  ? new Date(activeSubscription.trial_end * 1000) 
                  : null,
                customerId: customerId,
                fallback: false,
                recentlyVerified: true,
                autoUpgraded: true
              })
            }
          }
        } catch (stripeError) {
          console.log('⚠️ Stripe verification failed, continuing with database data:', stripeError)
        }
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