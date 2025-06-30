import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verify subscription request started')
    
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      console.error('❌ Stripe not configured')
      return NextResponse.json({ 
        error: 'Payment processing is not configured',
        subscriptionTier: 'free'
      }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.email) {
      console.error('❌ User not authenticated')
      return NextResponse.json({ 
        error: 'Not authenticated',
        subscriptionTier: 'free'
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.email)

    // Get user from database
    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { 
          id: true, 
          email: true, 
          customerId: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          trialEndDate: true
        }
      })
    })

    if (!user) {
      console.error('❌ User not found in database:', session.user.email)
      return NextResponse.json({ 
        error: 'User not found',
        subscriptionTier: 'free'
      }, { status: 404 })
    }

    console.log('✅ User found:', { 
      id: user.id, 
      customerId: user.customerId, 
      currentTier: user.subscriptionTier 
    })

    // If no customer ID, check if they have one in Stripe by email
    let customerId = user.customerId
    if (!customerId) {
      console.log('🔍 No customer ID stored, searching Stripe by email...')
      try {
        const customers = await stripe!.customers.list({
          email: session.user.email,
          limit: 1
        })
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
          console.log('✅ Found customer in Stripe:', customerId)
          
          // Update user with customer ID
          await withRetry(async () => {
            await prisma.user.update({
              where: { id: user.id },
              data: { customerId }
            })
          })
        } else {
          console.log('❌ No customer found in Stripe for email:', session.user.email)
        }
      } catch (error) {
        console.error('❌ Error searching for customer:', error)
      }
    }

    if (!customerId) {
      console.log('⚠️ No Stripe customer found for user')
      return NextResponse.json({ 
        success: true,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        message: 'No Stripe customer found'
      })
    }

    // Get subscriptions from Stripe
    console.log('🔍 Fetching subscriptions from Stripe for customer:', customerId)
    const subscriptions = await stripe!.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    })

    console.log('🔍 Found subscriptions:', subscriptions.data.length)
    
    // Find active or trialing subscription
    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    )

    let subscriptionTier = 'free'
    let subscriptionStatus = 'active'
    let needsUpdate = false

    if (activeSubscription) {
      subscriptionTier = 'premium'
      subscriptionStatus = activeSubscription.status
      
      console.log('✅ Active subscription found:', {
        id: activeSubscription.id,
        status: activeSubscription.status,
        trialEnd: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000).toISOString() : null
      })

      // Check if database needs update
      if (user.subscriptionTier !== 'premium' || user.subscriptionStatus !== subscriptionStatus) {
        needsUpdate = true
        console.log('💾 Database needs update - syncing subscription data...')
        
        await withRetry(async () => {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'premium',
              subscriptionStatus: subscriptionStatus,
              subscriptionId: activeSubscription.id,
              customerId: customerId,
              subscriptionStartDate: activeSubscription.start_date 
                ? new Date(activeSubscription.start_date * 1000) 
                : null,
              subscriptionEndDate: (activeSubscription as any).current_period_end 
                ? new Date((activeSubscription as any).current_period_end * 1000) 
                : null,
              trialEndDate: activeSubscription.trial_end 
                ? new Date(activeSubscription.trial_end * 1000) 
                : null,
            }
          })
        })

        console.log('✅ User updated to premium successfully')
      }
    } else {
      console.log('❌ No active subscription found')
      
      // Check if user needs downgrade
      if (user.subscriptionTier === 'premium') {
        needsUpdate = true
        console.log('💾 User needs downgrade to free tier')
        
        await withRetry(async () => {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled',
              subscriptionEndDate: new Date()
            }
          })
        })

        console.log('✅ User downgraded to free tier')
      }
    }

    return NextResponse.json({ 
      success: true,
      subscriptionTier,
      subscriptionStatus,
      customerId,
      updated: needsUpdate,
      message: needsUpdate 
        ? `Subscription synced: ${subscriptionTier} (${subscriptionStatus})`
        : 'Subscription status verified',
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000).toISOString(),
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
      }))
    })
  } catch (error) {
    console.error('❌ Error verifying subscription:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify subscription',
        subscriptionTier: 'free',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 