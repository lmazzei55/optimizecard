import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { spendingData: true }
      })
    })

    // Auto-create user if they don't exist
    if (!user) {
      console.log('❌ User not found for spending, auto-creating:', session.user.email)
      user = await withRetry(async () => {
        return await prisma.user.create({
          data: {
            email: session.user.email!,
            name: session.user.name || session.user.email!.split('@')[0],
            image: session.user.image,
            rewardPreference: 'cashback',
            pointValue: 0.01,
            enableSubCategories: false,
            subscriptionTier: 'premium', // Set as premium since you're a paying customer
            subscriptionStatus: 'active',
            spendingData: '[]' // Empty spending data
          },
          select: { spendingData: true }
        })
      })
      console.log('✅ Auto-created premium user for spending:', session.user.email)
    }

    // Parse spending data if it exists
    let spending = []
    if (user.spendingData) {
      try {
        spending = JSON.parse(user.spendingData)
      } catch (error) {
        console.error('Error parsing user spending data:', error)
        // Return empty array if parsing fails
        spending = []
      }
    }

    return NextResponse.json({ spending })
  } catch (error: any) {
    console.error('Error fetching user spending:', error)
    
    // Enhanced error handling for different types of database errors
    if (error?.code === 'P2010' || 
        error?.code === '42P05' || 
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('connection')) {
      console.error('Database connection pool issue in spending API')
      return NextResponse.json(
        { error: 'Database temporarily unavailable', code: 'DB_POOL_ERROR', fallback: true, spending: [] },
        { status: 200 }
      )
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { spending } = body

    if (!Array.isArray(spending)) {
      return NextResponse.json({ error: 'Invalid spending data' }, { status: 400 })
    }

    // Ensure user exists before updating spending data
    let existingUser = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true }
      })
    })

    if (!existingUser) {
      console.log('❌ User not found for spending update, auto-creating:', session.user.email)
      existingUser = await withRetry(async () => {
        return await prisma.user.create({
          data: {
            email: session.user.email!,
            name: session.user.name || session.user.email!.split('@')[0],
            image: session.user.image,
            rewardPreference: 'cashback',
            pointValue: 0.01,
            enableSubCategories: false,
            subscriptionTier: 'premium', // Set as premium since you're a paying customer
            subscriptionStatus: 'active',
            spendingData: '[]'
          },
          select: { id: true }
        })
      })
      console.log('✅ Auto-created premium user for spending update:', session.user.email)
    }

    // Update user's spending data with retry logic
    await withRetry(async () => {
      return await prisma.user.update({
        where: { email: session.user.email! },
        data: { spendingData: JSON.stringify(spending) }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving user spending:', error)
    
    // Enhanced error handling
    if (error?.code === 'P2010' || 
        error?.code === '42P05' || 
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('connection')) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable', code: 'DB_POOL_ERROR', fallback: true },
        { status: 200 }
      )
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
} 