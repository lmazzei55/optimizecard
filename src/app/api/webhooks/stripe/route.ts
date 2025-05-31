import { NextRequest, NextResponse } from 'next/server'
import { stripe, WEBHOOK_SECRET } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  console.log('=== STRIPE WEBHOOK RECEIVED ===')
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  console.log('Body length:', body.length)
  console.log('Has signature:', !!signature)

  if (!signature) {
    console.log('ERROR: No signature provided')
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
    console.log('✅ Webhook signature verified')
    console.log('Event type:', event.type)
    console.log('Event ID:', event.id)
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription)
        break
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  
  if (!userId) {
    console.error('No userId found in subscription metadata')
    return
  }

  const isActive = subscription.status === 'active'
  const subscriptionTier = isActive ? 'premium' : 'free'
  
  // Cast to any to access period properties that may not be in TypeScript definitions
  const sub = subscription as any
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      subscriptionStartDate: sub.current_period_start 
        ? new Date(sub.current_period_start * 1000) 
        : null,
      subscriptionEndDate: sub.current_period_end 
        ? new Date(sub.current_period_end * 1000) 
        : null,
    },
  })

  console.log(`Updated user ${userId} subscription to ${subscriptionTier} (${subscription.status})`)
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  
  if (!userId) {
    console.error('No userId found in subscription metadata')
    return
  }

  // Cast to any to access period properties
  const sub = subscription as any

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      subscriptionEndDate: sub.current_period_end 
        ? new Date(sub.current_period_end * 1000) 
        : new Date(),
    },
  })

  console.log(`Canceled subscription for user ${userId}`)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  
  if (!userId) {
    console.error('No userId found in checkout session metadata')
    return
  }

  // Retrieve the subscription
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    await handleSubscriptionChange(subscription)
  }

  console.log(`Checkout completed for user ${userId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  // Find user by customer ID
  const user = await prisma.user.findFirst({
    where: { customerId },
    select: { id: true, email: true }
  })
  
  if (!user) {
    console.error('No user found for customer', customerId)
    return
  }

  // Update subscription status to past_due
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  })

  console.log(`Payment failed for user ${user.id} (${user.email})`)
  
  // Here you could send an email notification about the failed payment
} 