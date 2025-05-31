import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe'
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { customerId: true }
    })

    if (!user?.customerId) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 })
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pricing`,
    })

    return NextResponse.json({ portalUrl: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
} 