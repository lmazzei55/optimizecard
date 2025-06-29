import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        customerId: true,
        subscriptionId: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialEndDate: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      authenticated: true,
      email: session.user.email,
      user: user || 'User not found in database',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('User status error:', error)
    return NextResponse.json(
      { error: `Failed to get user status: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 