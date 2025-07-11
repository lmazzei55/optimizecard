import { NextRequest, NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { Client } from 'pg'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const body = await request.json()
    let email = body.email
    
    // If no email provided, try to get from authenticated session
    if (!email) {
      const { auth } = await import('@/lib/auth')
      const session = await auth()
      if (session?.user?.email) {
        email = session.user.email
      } else {
        return NextResponse.json({ error: 'Email required or user must be authenticated' }, { status: 400 })
      }
    }

    console.log(`🔍 Looking up Stripe customer for email: ${email}`)

    // Find customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No Stripe customer found for this email' }, { status: 404 })
    }

    const customer = customers.data[0]
    console.log(`✅ Found customer: ${customer.id}`)

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all'
    })

    console.log(`📋 Found ${subscriptions.data.length} subscriptions`)

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    )

    let subscriptionTier = 'free'
    let subscriptionStatus = 'inactive'
    let subscriptionData: any = {}

    if (activeSubscription) {
      console.log(`🎯 Active subscription found: ${activeSubscription.id} (${activeSubscription.status})`)
      
      switch (activeSubscription.status) {
        case 'active':
        case 'trialing':
          subscriptionTier = 'premium'
          subscriptionStatus = activeSubscription.status
          break
        case 'past_due':
          subscriptionTier = 'premium'
          subscriptionStatus = 'past_due'
          break
        default:
          subscriptionTier = 'free'
          subscriptionStatus = activeSubscription.status
      }

      subscriptionData = {
        subscriptionId: activeSubscription.id,
        subscriptionStartDate: new Date(activeSubscription.start_date * 1000).toISOString(),
        subscriptionEndDate: (activeSubscription as any).current_period_end ? 
          new Date((activeSubscription as any).current_period_end * 1000).toISOString() : null,
        trialEndDate: activeSubscription.trial_end ? 
          new Date(activeSubscription.trial_end * 1000).toISOString() : null,
      }
    } else {
      console.log(`ℹ️ No active subscription found for customer`)
    }

    // Update database directly using pg client to avoid prepared statement issues
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    try {
      await client.connect()
      
      console.log(`💾 Updating database: ${email} -> ${subscriptionTier} (${subscriptionStatus})`)
      
      const result = await client.query(`
        UPDATE "User" 
        SET 
          "subscriptionTier" = $1,
          "subscriptionStatus" = $2,
          "customerId" = $3,
          "subscriptionId" = $4,
          "subscriptionStartDate" = $5,
          "subscriptionEndDate" = $6,
          "trialEndDate" = $7
        WHERE "email" = $8
        RETURNING "email", "subscriptionTier", "subscriptionStatus"
      `, [
        subscriptionTier,
        subscriptionStatus,
        customer.id,
        subscriptionData.subscriptionId || null,
        subscriptionData.subscriptionStartDate || null,
        subscriptionData.subscriptionEndDate || null,
        subscriptionData.trialEndDate || null,
        email
      ])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
      }

      const updatedUser = result.rows[0]
      console.log('✅ Database updated successfully:', updatedUser)

      return NextResponse.json({
        success: true,
        user: updatedUser,
        stripeCustomer: {
          id: customer.id,
          email: customer.email
        },
        subscription: activeSubscription ? {
          id: activeSubscription.id,
          status: activeSubscription.status,
          ...subscriptionData
        } : null
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('❌ Sync subscription error:', error)
    return NextResponse.json({ 
      error: 'Failed to sync subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 