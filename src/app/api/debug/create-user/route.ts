import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Debug: Creating/updating user in database:', session.user.email)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    let user
    if (existingUser) {
      // Update existing user to premium
      user = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          name: session.user.name || existingUser.name,
          image: session.user.image || existingUser.image,
          subscriptionTier: 'premium', // Set to premium
          rewardPreference: 'best_overall', // Set to their current preference
          pointValue: 0.01,
          enableSubCategories: false
        }
      })
      console.log('✅ Updated existing user to premium:', session.user.email)
    } else {
      // Create new user as premium
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          image: session.user.image,
          rewardPreference: 'best_overall',
          pointValue: 0.01,
          enableSubCategories: false,
          subscriptionTier: 'premium' // Create as premium user
        }
      })
      console.log('✅ Created new premium user:', session.user.email)
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier,
        rewardPreference: user.rewardPreference
      },
      message: existingUser ? 'User updated to premium' : 'User created as premium'
    })

  } catch (error: any) {
    console.error('❌ Debug Create User Error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user', details: error?.message },
      { status: 500 }
    )
  }
} 