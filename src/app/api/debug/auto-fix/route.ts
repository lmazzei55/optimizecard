import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, isStripeConfigured } from '@/lib/stripe'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Auto-Fix: Starting comprehensive fix for:', session.user.email)

    const fixes = []
    let user = null

    // Step 1: Ensure user exists in database
    try {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || session.user.email.split('@')[0],
            image: session.user.image,
            rewardPreference: 'cashback',
            pointValue: 0.01,
            enableSubCategories: false,
            subscriptionTier: 'free' // Start as free, will upgrade via Stripe sync
          }
        })
        fixes.push({
          step: 'CREATE_USER',
          description: 'Created user in database',
          success: true
        })
        console.log('✅ Auto-Fix: Created user in database')
      } else {
        fixes.push({
          step: 'USER_EXISTS',
          description: 'User already exists in database',
          success: true
        })
      }
    } catch (error: any) {
      fixes.push({
        step: 'CREATE_USER',
        description: 'Failed to create user in database',
        success: false,
        error: error.message
      })
      console.error('❌ Auto-Fix: Failed to create user:', error)
    }

    // Step 2: Sync Stripe subscription if user has customer ID
    if (user?.customerId && isStripeConfigured && stripe) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.customerId,
          limit: 10
        })

        const activeSubscription = subscriptions.data.find(sub => 
          sub.status === 'active' || sub.status === 'trialing'
        )

        if (activeSubscription) {
          // Update user to premium
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'premium',
              subscriptionStatus: activeSubscription.status,
              subscriptionId: activeSubscription.id,
              subscriptionStartDate: new Date((activeSubscription as any).start_date * 1000),
              subscriptionEndDate: new Date((activeSubscription as any).current_period_end * 1000),
              trialEndDate: (activeSubscription as any).trial_end 
                ? new Date((activeSubscription as any).trial_end * 1000) 
                : null
            }
          })

          fixes.push({
            step: 'STRIPE_SYNC',
            description: 'Synced active Stripe subscription to premium tier',
            success: true,
            subscriptionId: activeSubscription.id,
            status: activeSubscription.status
          })
          console.log('✅ Auto-Fix: Synced Stripe subscription to premium')
        } else {
          fixes.push({
            step: 'STRIPE_SYNC',
            description: 'No active Stripe subscription found',
            success: true,
            note: 'User remains on free tier'
          })
        }
      } catch (stripeError: any) {
        fixes.push({
          step: 'STRIPE_SYNC',
          description: 'Failed to sync Stripe subscription',
          success: false,
          error: stripeError.message
        })
        console.error('❌ Auto-Fix: Stripe sync failed:', stripeError)
      }
    } else if (user && !user.customerId) {
      fixes.push({
        step: 'STRIPE_SYNC',
        description: 'No Stripe customer ID found',
        success: true,
        note: 'User may be a demo user or not have completed checkout'
      })
    }

    // Step 3: Get final user state
    const finalUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        customerId: true,
        rewardPreference: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Auto-fix completed',
      fixes,
      finalUserState: finalUser,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Auto-Fix Error:', error)
    return NextResponse.json(
      { error: 'Auto-fix failed', details: error?.message },
      { status: 500 }
    )
  }
} 