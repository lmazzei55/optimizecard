import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, isStripeConfigured } from '@/lib/stripe'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Diagnostic: Checking user state for:', session.user.email)

    const diagnosis = {
      timestamp: new Date().toISOString(),
      user: {
        email: session.user.email,
        sessionId: session.user.id,
        sessionName: session.user.name
      },
      database: {
        exists: false,
        data: null as any,
        error: null as string | null
      },
      stripe: {
        configured: isStripeConfigured,
        customerId: null as string | null,
        subscriptions: [] as any[],
        error: null as string | null
      },
      recommendations: [] as Array<{
        issue: string
        description: string
        solution: string
        severity: string
      }>,
      summary: null as any
    }

    // Check if user exists in database
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionId: true,
          customerId: true,
          rewardPreference: true,
          pointValue: true,
          enableSubCategories: true,
          createdAt: true,
          updatedAt: true
        }
      })

      diagnosis.database.exists = !!dbUser
      diagnosis.database.data = dbUser

      if (!dbUser) {
        diagnosis.recommendations.push({
          issue: 'USER_NOT_EXISTS',
          description: 'User does not exist in database',
          solution: 'Call /api/debug/create-user POST endpoint to create user',
          severity: 'CRITICAL'
        })
      } else {
        // Check subscription status
        if (dbUser.subscriptionTier === 'free') {
          diagnosis.recommendations.push({
            issue: 'FREE_TIER_IN_DB',
            description: 'User is marked as free tier in database',
            solution: 'Check Stripe subscription status and sync',
            severity: 'HIGH'
          })
        }

        // Check for Stripe customer ID
        if (dbUser.customerId) {
          diagnosis.stripe.customerId = dbUser.customerId

          // Check Stripe subscriptions if configured
          if (isStripeConfigured && stripe) {
            try {
              const subscriptions = await stripe.subscriptions.list({
                customer: dbUser.customerId,
                limit: 10
              })

                             diagnosis.stripe.subscriptions = subscriptions.data.map(sub => ({
                 id: sub.id,
                 status: sub.status,
                 created: new Date(sub.created * 1000).toISOString(),
                 currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
                 items: sub.items.data.map(item => ({
                   priceId: item.price.id,
                   productId: typeof item.price.product === 'string' ? item.price.product : (item.price.product as any)?.id
                 }))
               }))

              const activeSubscription = subscriptions.data.find(sub => 
                sub.status === 'active' || sub.status === 'trialing'
              )

              if (activeSubscription && dbUser.subscriptionTier === 'free') {
                diagnosis.recommendations.push({
                  issue: 'STRIPE_DB_MISMATCH',
                  description: 'Active subscription in Stripe but free tier in database',
                  solution: 'Call /api/stripe/sync-subscription POST endpoint to sync',
                  severity: 'CRITICAL'
                })
              }

              if (!activeSubscription && dbUser.subscriptionTier === 'premium') {
                diagnosis.recommendations.push({
                  issue: 'NO_ACTIVE_STRIPE_SUB', 
                  description: 'Premium tier in database but no active Stripe subscription',
                  solution: 'Check Stripe dashboard or downgrade user to free tier',
                  severity: 'HIGH'
                })
              }

            } catch (stripeError: any) {
              diagnosis.stripe.error = stripeError.message
              diagnosis.recommendations.push({
                issue: 'STRIPE_API_ERROR',
                description: `Stripe API error: ${stripeError.message}`,
                solution: 'Check Stripe configuration and API keys',
                severity: 'HIGH'
              })
            }
          }
        } else {
          diagnosis.recommendations.push({
            issue: 'NO_STRIPE_CUSTOMER',
            description: 'User has no Stripe customer ID',
            solution: 'User may be a test user or need to go through checkout flow',
            severity: 'MEDIUM'
          })
        }
      }

    } catch (dbError: any) {
      diagnosis.database.error = dbError.message
      diagnosis.recommendations.push({
        issue: 'DATABASE_ERROR',
        description: `Database error: ${dbError.message}`,
        solution: 'Check database connection and query',
        severity: 'CRITICAL'
      })
    }

    // Add summary
    const criticalIssues = diagnosis.recommendations.filter(r => r.severity === 'CRITICAL').length
    const highIssues = diagnosis.recommendations.filter(r => r.severity === 'HIGH').length

    diagnosis.summary = {
      criticalIssues,
      highIssues,
      totalIssues: diagnosis.recommendations.length,
      status: criticalIssues > 0 ? 'CRITICAL' : highIssues > 0 ? 'NEEDS_ATTENTION' : 'HEALTHY'
    }

    return NextResponse.json(diagnosis)

  } catch (error: any) {
    console.error('❌ Diagnostic Error:', error)
    return NextResponse.json(
      { error: 'Diagnostic failed', details: error?.message },
      { status: 500 }
    )
  }
} 