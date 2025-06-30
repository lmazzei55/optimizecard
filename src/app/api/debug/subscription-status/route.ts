import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('🔍 Debug: Checking subscription status for:', session.user.email)

    const report = {
      user: session.user.email,
      timestamp: new Date().toISOString(),
      checks: {} as any,
      analysis: {} as any
    }

    // 1. Check database user record
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          customerId: true,
          subscriptionId: true,
          trialEndDate: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true
        }
      })
      
      report.checks.database = {
        success: true,
        user: user
      }
    } catch (error: any) {
      report.checks.database = {
        success: false,
        error: error.message
      }
    }

    // 2. Check Stripe customer
    if (isStripeConfigured && stripe && report.checks.database?.user?.customerId) {
      try {
        const customer = await stripe.customers.retrieve(report.checks.database.user.customerId)
        report.checks.stripeCustomer = {
          success: true,
          customer: {
            id: customer.id,
            email: (customer as any).email,
            created: new Date((customer as any).created * 1000).toISOString()
          }
        }
      } catch (error: any) {
        report.checks.stripeCustomer = {
          success: false,
          error: error.message
        }
      }
    }

    // 3. Check Stripe subscriptions
    if (isStripeConfigured && stripe && report.checks.database?.user?.customerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: report.checks.database.user.customerId,
          limit: 10
        })
        
        report.checks.stripeSubscriptions = {
          success: true,
          count: subscriptions.data.length,
          subscriptions: subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            created: new Date(sub.created * 1000).toISOString(),
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            current_period_end: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null
          }))
        }
      } catch (error: any) {
        report.checks.stripeSubscriptions = {
          success: false,
          error: error.message
        }
      }
    }

    // 4. Analysis
    const dbTier = report.checks.database?.user?.subscriptionTier
    const activeStripeSubscription = report.checks.stripeSubscriptions?.subscriptions?.find((sub: any) => 
      sub.status === 'active' || sub.status === 'trialing'
    )
    
    report.analysis = {
      databaseTier: dbTier,
      hasActiveStripeSubscription: !!activeStripeSubscription,
      mismatch: dbTier === 'free' && !!activeStripeSubscription,
      recommendation: null as string | null
    }

    if (report.analysis.mismatch) {
      report.analysis.recommendation = 'Database shows free but Stripe has active subscription - needs sync'
    } else if (dbTier === 'premium' && !activeStripeSubscription) {
      report.analysis.recommendation = 'Database shows premium but no active Stripe subscription - may need downgrade'
    } else {
      report.analysis.recommendation = 'Database and Stripe are in sync'
    }

    return NextResponse.json(report)

  } catch (error: any) {
    console.error('❌ Debug subscription status error:', error)
    return NextResponse.json({
      error: 'Failed to check subscription status',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('🔧 Debug: Manually fixing subscription for:', session.user.email)

    // Force sync with Stripe and update database
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, customerId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = user.customerId

    // Find customer by email if no customerId
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 1
      })
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
        
        // Update user with customer ID
        await prisma.user.update({
          where: { id: user.id },
          data: { customerId }
        })
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10
    })

    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    )

    let subscriptionTier = 'free'
    let subscriptionStatus = 'active'

    if (activeSubscription) {
      subscriptionTier = 'premium'
      subscriptionStatus = activeSubscription.status
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier,
        subscriptionStatus,
        customerId,
        subscriptionId: activeSubscription?.id || null,
        subscriptionStartDate: activeSubscription?.start_date 
          ? new Date(activeSubscription.start_date * 1000) 
          : null,
        subscriptionEndDate: activeSubscription && (activeSubscription as any).current_period_end 
          ? new Date((activeSubscription as any).current_period_end * 1000) 
          : null,
        trialEndDate: activeSubscription?.trial_end 
          ? new Date(activeSubscription.trial_end * 1000) 
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription manually synced',
      before: { tier: user.customerId ? 'unknown' : 'free' },
      after: {
        tier: subscriptionTier,
        status: subscriptionStatus,
        customerId,
        subscriptionId: activeSubscription?.id
      },
      updatedUser: {
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
        trialEndDate: updatedUser.trialEndDate
      }
    })

  } catch (error: any) {
    console.error('❌ Debug fix subscription error:', error)
    return NextResponse.json({
      error: 'Failed to fix subscription',
      details: error.message
    }, { status: 500 })
  }
} 