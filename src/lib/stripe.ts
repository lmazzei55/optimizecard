import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Check if Stripe is configured (server-side check)
export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY && 
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
)

// Server-side Stripe instance (only if configured)
export const stripe = isStripeConfigured 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    })
  : null

// Client-side Stripe instance (only if configured)
export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe not configured - missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    return null
  }
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

// Premium subscription price ID
export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly'

// Webhook secret for verifying Stripe webhooks
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Subscription configuration
export const STRIPE_CONFIG = {
  products: {
    premium: {
      monthly: {
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1234567890', // Use actual price ID from env
        amount: 999, // $9.99 in cents
      }
    }
  },
  successUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard?success=true`,
  cancelUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pricing?canceled=true`,
} 