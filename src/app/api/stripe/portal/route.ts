import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { Client } from 'pg'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ 
        error: 'Payment processing is not configured' 
      }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Portal request for user:', session.user.email)

    // Get user from database using direct SQL to avoid prepared statement conflicts
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    let user
    try {
      await client.connect()
      
      const result = await client.query(`
        SELECT "customerId", "subscriptionTier", "subscriptionStatus" 
        FROM "User" 
        WHERE "email" = $1
      `, [session.user.email])
      
      user = result.rows[0]
      console.log('User data:', user)
      
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    } finally {
      await client.end()
    }

    if (!user?.customerId) {
      console.log('No customer ID found for user')
      return NextResponse.json({ error: 'No customer found' }, { status: 404 })
    }

    // Verify customer exists in Stripe
    let stripeCustomer
    try {
      stripeCustomer = await stripe.customers.retrieve(user.customerId)
      console.log('Stripe customer found:', stripeCustomer.id)
    } catch (stripeError) {
      console.error('Error retrieving Stripe customer:', stripeError)
      return NextResponse.json({ 
        error: 'Customer not found in Stripe. Please contact support.' 
      }, { status: 404 })
    }

    // Create customer portal session
    const returnUrl = `${process.env.NEXTAUTH_URL || 'https://www.optimizecard.com'}/pricing`
    console.log('Creating portal session with return URL:', returnUrl)
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: returnUrl,
      configuration: undefined, // Use default configuration which should respect account settings
    })

    console.log('Portal session created successfully')
    return NextResponse.json({ portalUrl: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: `Failed to create portal session: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 