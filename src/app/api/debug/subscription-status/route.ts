import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { withRetry } from '@/lib/prisma'

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

    // 1. Check database user record with retry logic
    try {
      const { PrismaClient } = require('@/generated/prisma')
      const prisma = new PrismaClient()
      
      const user = await withRetry(async () => {
        return await prisma.$queryRaw`
          SELECT "email", "subscriptionTier", "subscriptionStatus", "customerId", "subscriptionId"
          FROM "User" 
          WHERE "email" = ${session.user.email}
          LIMIT 1
        `
      })
      
      await prisma.$disconnect()
      
      report.checks.database = {
        success: true,
        user: user[0] || null
      }
    } catch (error: any) {
      report.checks.database = {
        success: false,
        error: error.message?.substring(0, 200)
      }
    }

    // 2. Check Stripe customer and subscriptions
    if (isStripeConfigured && stripe && report.checks.database?.user?.customerId) {
      try {
        const customerId = report.checks.database.user.customerId
        
        // Get customer info
        const customer = await stripe.customers.retrieve(customerId)
        report.checks.stripeCustomer = {
          success: true,
          customer: {
            id: customer.id,
            email: (customer as any).email,
            created: new Date((customer as any).created * 1000).toISOString()
          }
        }
        
        // Get subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 5
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
          error: error.message?.substring(0, 200)
        }
      }
    }

    // 3. Analysis
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
      details: error.message?.substring(0, 200)
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

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    // Get user with retry logic
    const { PrismaClient } = require('@/generated/prisma')
    const prisma = new PrismaClient()
    
    const users = await withRetry(async () => {
      return await prisma.$queryRaw`
        SELECT "id", "email", "customerId", "subscriptionTier"
        FROM "User" 
        WHERE "email" = ${session.user.email}
        LIMIT 1
      `
    })

    if (!users || users.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users[0]
    let customerId = user.customerId

    // Find customer by email if no customerId
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 1
      })
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      }
    }

    if (!customerId) {
      await prisma.$disconnect()
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

    // Update user with raw SQL to avoid prepared statement conflicts
    await withRetry(async () => {
      return await prisma.$executeRaw`
        UPDATE "User" 
        SET 
          "subscriptionTier" = ${subscriptionTier},
          "subscriptionStatus" = ${subscriptionStatus},
          "customerId" = ${customerId},
          "subscriptionId" = ${activeSubscription?.id || null},
          "subscriptionStartDate" = ${activeSubscription?.start_date ? new Date(activeSubscription.start_date * 1000) : null},
          "subscriptionEndDate" = ${activeSubscription && (activeSubscription as any).current_period_end ? new Date((activeSubscription as any).current_period_end * 1000) : null},
          "trialEndDate" = ${activeSubscription?.trial_end ? new Date(activeSubscription.trial_end * 1000) : null}
        WHERE "email" = ${session.user.email}
      `
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'Subscription manually synced',
      before: { tier: user.subscriptionTier },
      after: {
        tier: subscriptionTier,
        status: subscriptionStatus,
        customerId,
        subscriptionId: activeSubscription?.id
      }
    })

  } catch (error: any) {
    console.error('❌ Debug fix subscription error:', error)
    return NextResponse.json({
      error: 'Failed to fix subscription',
      details: error.message?.substring(0, 200)
    }, { status: 500 })
  }
} 