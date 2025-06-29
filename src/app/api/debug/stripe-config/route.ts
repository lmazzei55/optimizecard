import { NextRequest, NextResponse } from 'next/server'
import { isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      isStripeConfigured,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasPremiumPriceId: !!process.env.STRIPE_PREMIUM_PRICE_ID,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      config: {
        priceId: STRIPE_CONFIG.products.premium.monthly.priceId,
        amount: STRIPE_CONFIG.products.premium.monthly.amount,
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Stripe config debug error:', error)
    return NextResponse.json(
      { error: `Failed to get Stripe config: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 