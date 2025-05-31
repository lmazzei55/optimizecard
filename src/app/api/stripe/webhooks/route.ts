import { NextRequest, NextResponse } from 'next/server'
import { stripe, WEBHOOK_SECRET, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({ 
        error: 'Payment processing is not configured' 
      }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature (stripe is guaranteed to be non-null here)
    let event: Stripe.Event
    try {
      event = stripe!.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('📨 Stripe webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChanged(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout completed:', session.id)
  
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe!.subscriptions.retrieve(session.subscription as string)
    await handleSubscriptionChanged(subscription)
  }
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription changed:', subscription.id, subscription.status)
  
  const customerId = subscription.customer as string
  const customer = await stripe!.customers.retrieve(customerId) as Stripe.Customer
  
  if (!customer.email) {
    console.error('No email found for customer:', customerId)
    return
  }

  // Determine subscription status
  let subscriptionTier: string
  let subscriptionStatus: string
  
  switch (subscription.status) {
    case 'active':
    case 'trialing':
      subscriptionTier = 'premium'
      subscriptionStatus = 'active'
      break
    case 'past_due':
      subscriptionTier = 'premium' // Keep premium during grace period
      subscriptionStatus = 'past_due'
      break
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      subscriptionTier = 'free'
      subscriptionStatus = 'canceled'
      break
    case 'incomplete':
      subscriptionTier = 'free'
      subscriptionStatus = 'incomplete'
      break
    default:
      subscriptionTier = 'free'
      subscriptionStatus = subscription.status
  }

  // Update user in database
  await prisma.user.update({
    where: { email: customer.email },
    data: {
      subscriptionTier,
      subscriptionStatus,
      subscriptionId: subscription.id,
      customerId: customerId,
      subscriptionStartDate: (subscription as any).start_date ? new Date((subscription as any).start_date * 1000) : null,
      subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
      trialEndDate: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
    }
  })

  console.log(`Updated user ${customer.email} to ${subscriptionTier} (${subscriptionStatus})`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription deleted:', subscription.id)
  
  const customerId = subscription.customer as string
  const customer = await stripe!.customers.retrieve(customerId) as Stripe.Customer
  
  if (!customer.email) {
    console.error('No email found for customer:', customerId)
    return
  }

  // Downgrade user to free tier
  await prisma.user.update({
    where: { email: customer.email },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      subscriptionEndDate: new Date(),
    }
  })

  console.log(`Downgraded user ${customer.email} to free tier`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Payment succeeded:', invoice.id)
  
  if ((invoice as any).subscription) {
    const subscription = await stripe!.subscriptions.retrieve((invoice as any).subscription as string)
    await handleSubscriptionChanged(subscription)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('💥 Payment failed:', invoice.id)
  
  // Could send email notification or update user status
  // For now, just log it - Stripe will handle retries
} 