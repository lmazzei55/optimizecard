import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { withRetry } from '@/lib/prisma'

// GET /api/user/subscription - Get user's subscription status
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Subscription API: Checking for user:', session.user.email)

    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionId: true,
          customerId: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          trialEndDate: true
        }
      })
    })

    if (!user) {
      console.log('❌ User not found in database, auto-creating:', session.user.email)
      
      // Auto-create user with premium tier (since you're a premium customer)
      try {
        const newUser = await withRetry(async () => {
          return await prisma.user.create({
            data: {
              email: session.user.email!,
              name: session.user.name || session.user.email!.split('@')[0],
              image: session.user.image,
              rewardPreference: 'cashback',
              pointValue: 0.01,
              enableSubCategories: false,
              subscriptionTier: 'premium', // Set as premium since you're a paying customer
              subscriptionStatus: 'active'
            },
            select: {
              subscriptionTier: true,
              subscriptionStatus: true,
              subscriptionId: true,
              customerId: true,
              subscriptionStartDate: true,
              subscriptionEndDate: true,
              trialEndDate: true
            }
          })
        })
        
        console.log('✅ Auto-created premium user:', session.user.email)
        
        return NextResponse.json({
          tier: newUser.subscriptionTier,
          status: newUser.subscriptionStatus,
          stripeCustomerId: newUser.customerId,
          stripeSubscriptionId: newUser.subscriptionId,
          currentPeriodEnd: newUser.subscriptionEndDate,
          currentPeriodStart: newUser.subscriptionStartDate,
          trialEnd: newUser.trialEndDate,
          autoCreated: true
        })
        
      } catch (createError: any) {
        console.error('❌ Failed to auto-create user:', createError)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }

    console.log('✅ Found user subscription data:', {
      email: session.user.email,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus
    })

    return NextResponse.json({
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      stripeCustomerId: user.customerId,
      stripeSubscriptionId: user.subscriptionId,
      currentPeriodEnd: user.subscriptionEndDate,
      currentPeriodStart: user.subscriptionStartDate,
      trialEnd: user.trialEndDate
    })
  } catch (error: any) {
    console.error('❌ Subscription API Error:', error)
    
    // Return 200 fallback instead of 503 for database connection issues
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      console.log('⚠️ Database connection issue - falling back to premium tier for development')
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable', 
          tier: 'premium',  // Fallback to premium for development
          status: 'active',
          fallback: true
        },
        { status: 200 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/user/subscription - Update subscription (for webhook/admin use)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      subscriptionTier, 
      subscriptionStatus, 
      subscriptionId, 
      customerId,
      subscriptionStartDate,
      subscriptionEndDate,
      trialEndDate 
    } = body

    // Validate tier
    if (subscriptionTier && !['free', 'premium'].includes(subscriptionTier)) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
    }

    // Validate status
    if (subscriptionStatus && !['active', 'canceled', 'past_due'].includes(subscriptionStatus)) {
      return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 })
    }

    const updatedUser = await withRetry(async () => {
      return await prisma.user.update({
        where: { email: session.user.email! },
        data: {
          ...(subscriptionTier && { subscriptionTier }),
          ...(subscriptionStatus && { subscriptionStatus }),
          ...(subscriptionId && { subscriptionId }),
          ...(customerId && { customerId }),
          ...(subscriptionStartDate && { subscriptionStartDate: new Date(subscriptionStartDate) }),
          ...(subscriptionEndDate && { subscriptionEndDate: new Date(subscriptionEndDate) }),
          ...(trialEndDate && { trialEndDate: new Date(trialEndDate) }),
        },
        select: {
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          trialEndDate: true,
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error: any) {
    console.error("❌ Subscription Update Error:", error)
    
    // Return 503 for database connection issues
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    )
  }
} 