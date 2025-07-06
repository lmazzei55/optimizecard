import { NextRequest, NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { Client } from 'pg'

export async function POST(request: NextRequest) {
  try {
    // Simple admin authentication check
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer admin-sync-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log(`🔧 Admin sync: Looking up subscription for ${email}`)

    // Find customer by email in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        success: false,
        message: 'No Stripe customer found for this email',
        email 
      })
    }

    const customer = customers.data[0]
    console.log(`✅ Found customer: ${customer.id}`)

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10
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
      console.log(`🎯 Active subscription: ${activeSubscription.id} (${activeSubscription.status})`)
      
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
    }

    // Update database
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    try {
      await client.connect()
      
      console.log(`💾 Admin sync: Updating ${email} -> ${subscriptionTier} (${subscriptionStatus})`)
      
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
        return NextResponse.json({ 
          success: false,
          error: 'User not found in database',
          email 
        })
      }

      const updatedUser = result.rows[0]
      console.log('✅ Admin sync completed:', updatedUser)

      return NextResponse.json({
        success: true,
        message: `Successfully synced ${email} to ${subscriptionTier} tier`,
        user: updatedUser,
        stripeData: {
          customerId: customer.id,
          subscriptionsFound: subscriptions.data.length,
          activeSubscription: activeSubscription ? {
            id: activeSubscription.id,
            status: activeSubscription.status,
            ...subscriptionData
          } : null
        }
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('❌ Admin sync error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to sync subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 