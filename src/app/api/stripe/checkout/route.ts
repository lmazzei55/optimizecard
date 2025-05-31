import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, STRIPE_CONFIG, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ 
        error: 'Payment processing is not configured. Please set up Stripe environment variables.' 
      }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { plan = 'monthly' } = body

    // Get or create Stripe customer
    let customer = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    })

    let customerId: string
    if (customer.data.length === 0) {
      // Create new customer
      const newCustomer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id || '',
        },
      })
      customerId = newCustomer.id
    } else {
      customerId = customer.data[0].id
    }

    // Update user with customer ID
    await prisma.user.update({
      where: { email: session.user.email },
      data: { customerId },
    })

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.products.premium.monthly.priceId,
          quantity: 1,
        },
      ],
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId: session.user.id || '',
        plan,
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId: session.user.id || '',
          plan,
        },
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 