import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Preferences API: Getting preferences for:', session.user.email)

    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          rewardPreference: true,
          pointValue: true,
          enableSubCategories: true
        }
      })
    })

    if (!user) {
      console.log('❌ User not found in preferences API, returning defaults:', session.user.email)
      // Return defaults instead of creating user here - let subscription API handle user creation
      return NextResponse.json({
        rewardPreference: 'cashback',
        pointValue: 0.01,
        enableSubCategories: false
      })
    }

    console.log('✅ Preferences API: Retrieved for user:', {
      email: session.user.email,
      rewardPreference: user.rewardPreference,
      pointValue: user.pointValue,
      enableSubCategories: user.enableSubCategories
    })

    return NextResponse.json({
      rewardPreference: user.rewardPreference,
      pointValue: user.pointValue,
      enableSubCategories: user.enableSubCategories
    })

  } catch (error: any) {
    console.error('❌ Preferences API Error:', error)
    
    // Enhanced error handling for database connection issues
    if (error?.code === 'P2010' || 
        error?.code === 'P1001' ||
        error?.code === '42P05' || 
        error?.message?.includes('prepared statement') || 
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout')) {
      console.error('🔌 Database connection issue in preferences API')
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }  // Service Unavailable instead of 200
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rewardPreference, pointValue, enableSubCategories } = await request.json()

    // Validate input data
    if (rewardPreference && !['cashback', 'points', 'best_overall'].includes(rewardPreference.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid reward preference' }, { status: 400 })
    }

    if (pointValue !== undefined && (pointValue < 0.005 || pointValue > 0.05)) {
      return NextResponse.json({ error: 'Invalid point value' }, { status: 400 })
    }

    // CRITICAL: Check subscription tier for premium features
    if (rewardPreference && ['points', 'best_overall'].includes(rewardPreference.toLowerCase())) {
      let user = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { subscriptionTier: true }
        })
      })

      // If user doesn't exist, create them with free tier (subscription API will upgrade if needed)
      if (!user) {
        console.log('❌ User not found for preferences, auto-creating as free tier:', session.user.email)
        user = await withRetry(async () => {
          return await prisma.user.create({
            data: {
              email: session.user.email!,
              name: session.user.name || session.user.email!.split('@')[0],
              image: session.user.image,
              rewardPreference: 'cashback',
              pointValue: 0.01,
              enableSubCategories: false,
              subscriptionTier: 'free', // Start as free, subscription API will upgrade
              subscriptionStatus: 'inactive'
            },
            select: { subscriptionTier: true }
          })
        })
        console.log('✅ Auto-created free tier user for preferences:', session.user.email)
      }

      if (user.subscriptionTier !== 'premium') {
        return NextResponse.json({ 
          error: 'Premium subscription required for this feature',
          code: 'PREMIUM_REQUIRED'
        }, { status: 403 })
      }
    }

    // Ensure user exists before updating
    let existingUser = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true }
      })
    })

    if (!existingUser) {
      console.log('❌ User not found for update, auto-creating as free tier:', session.user.email)
      existingUser = await withRetry(async () => {
        return await prisma.user.create({
          data: {
            email: session.user.email!,
            name: session.user.name || session.user.email!.split('@')[0],
            image: session.user.image,
            rewardPreference: 'cashback',
            pointValue: 0.01,
            enableSubCategories: false,
            subscriptionTier: 'free', // Start as free, subscription API will upgrade
            subscriptionStatus: 'inactive'
          },
          select: { id: true }
        })
      })
      console.log('✅ Auto-created free tier user for update:', session.user.email)
    }

    const updatedUser = await withRetry(async () => {
      return await prisma.user.update({
        where: { email: session.user.email! },
        data: {
          ...(rewardPreference && { rewardPreference: rewardPreference.toLowerCase() }),
          ...(pointValue !== undefined && { pointValue }),
          ...(enableSubCategories !== undefined && { enableSubCategories })
        },
        select: {
          rewardPreference: true,
          pointValue: true,
          enableSubCategories: true
        }
      })
    })

    console.log(`✅ Preferences updated for user:`, {
      rewardPreference: updatedUser.rewardPreference,
      pointValue: updatedUser.pointValue,
      enableSubCategories: updatedUser.enableSubCategories
    })

    return NextResponse.json({
      success: true,
      data: updatedUser
    })

  } catch (error: any) {
    console.error('❌ Preferences Update Error:', error)
    
    // Enhanced error handling for database connection issues
    if (error?.code === 'P2010' || 
        error?.code === 'P1001' ||
        error?.code === '42P05' || 
        error?.message?.includes('prepared statement') || 
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout')) {
      console.error('🔌 Database connection issue in preferences update')
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable', 
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }  // Service Unavailable instead of 200
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 