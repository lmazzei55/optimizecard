import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        customerId: true,
        subscriptionTier: true,
        subscriptionStatus: true 
      }
    })

    console.log('User data:', user)

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
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${process.env.NEXTAUTH_URL || 'https://optimizecard.com'}/pricing`,
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