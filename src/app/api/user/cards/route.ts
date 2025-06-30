import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET: Fetch all available cards and user's owned cards
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all available cards with enhanced retry logic
    let allCards: Array<{
      id: string
      name: string
      issuer: string
      annualFee: number
      rewardType: string
      applicationUrl: string | null
    }> = []
    try {
      allCards = await withRetry(async () => {
        return await prisma.creditCard.findMany({
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            issuer: true,
            annualFee: true,
            rewardType: true,
            applicationUrl: true,
          },
          orderBy: [
            { issuer: 'asc' },
            { name: 'asc' }
          ]
        })
      })
    } catch (cardError: any) {
      console.error('⚠️ Error fetching credit cards:', cardError.message)
      // If the creditCard table doesn't exist or is empty, return empty array
      // This allows the app to function even without seeded card data
      allCards = []
    }

    // Get user's owned cards, auto-create if needed
    let user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! },
      include: {
        ownedCards: {
          include: {
            card: true
          }
        }
      }
    })
    })

    // Auto-create user if they don't exist
    if (!user) {
      console.log('❌ User not found for cards, auto-creating:', session.user.email)
      user = await withRetry(async () => {
        return await prisma.user.create({
          data: {
            email: session.user.email!,
            name: session.user.name || session.user.email!.split('@')[0],
            image: session.user.image || null,
            rewardPreference: 'cashback',
            pointValue: 0.01,
            enableSubCategories: false,
            subscriptionTier: 'premium', // Set as premium since you're a paying customer
            subscriptionStatus: 'active'
          },
          include: {
            ownedCards: {
              include: {
                card: true
              }
            }
          }
        })
      })
      console.log('✅ Auto-created premium user for cards:', session.user.email)
    }

    const ownedCardIds = user?.ownedCards?.map((uc: any) => uc.cardId) || []

    console.log(`✅ Cards API: Found ${allCards.length} total cards, ${ownedCardIds.length} owned by user`)
    
    return NextResponse.json({
      allCards,
      ownedCardIds
    })

  } catch (error: any) {
    console.error('❌ Cards API Error:', error)
    
    // CRITICAL FIX: Don't return fallback data for authenticated users
    // Instead, return a proper error so the frontend can handle it appropriately
    
    // Check if it's a prepared statement conflict (common in serverless)
    if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
      console.error('🔄 Prepared statement conflict in cards API, resetting client...')
      return NextResponse.json(
        { error: 'Database connection reset, please try again', code: 'PREPARED_STATEMENT_CONFLICT' },
        { status: 503 }
      )
    }
    
    // Check if it's a database connection issue
    if (error?.code === 'P1001' || error?.message?.includes('connection') || error?.message?.includes('timeout')) {
      console.error('🔌 Database connection issue in cards API')
      return NextResponse.json(
        { error: 'Database temporarily unavailable', code: 'DB_CONNECTION_ERROR' },
        { status: 503 }
      )
    }
    
    // For other errors, return 500 instead of fallback data
    return NextResponse.json(
      { error: 'Failed to fetch cards', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Update user's owned cards
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ownedCardIds }: { ownedCardIds: string[] } = await request.json()

    // Remove all existing owned cards for this user
    await withRetry(async () => {
      return await prisma.userCard.deleteMany({
      where: {
        user: {
            email: session.user.email!
          }
        }
      })
    })

    // Add the new owned cards
    if (ownedCardIds.length > 0) {
      let user = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { email: session.user.email! }
      })
      })

      // Auto-create user if they don't exist
      if (!user) {
        console.log('❌ User not found for card update, auto-creating:', session.user.email)
        user = await withRetry(async () => {
          return await prisma.user.create({
            data: {
              email: session.user.email!,
              name: session.user.name || session.user.email!.split('@')[0],
              image: session.user.image || null,
              rewardPreference: 'cashback',
              pointValue: 0.01,
              enableSubCategories: false,
              subscriptionTier: 'premium', // Set as premium since you're a paying customer
              subscriptionStatus: 'active'
            }
          })
        })
        console.log('✅ Auto-created premium user for card update:', session.user.email)
      }

      await withRetry(async () => {
        return await prisma.userCard.createMany({
        data: ownedCardIds.map(cardId => ({
            userId: user!.id,
          cardId
        }))
        })
      })
    }

    console.log(`✅ Cards updated for user: ${ownedCardIds.length} cards`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ Cards Update Error:', error)
    
    // Check if it's a prepared statement conflict (common in serverless)
    if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
      console.error('🔄 Prepared statement conflict in cards update, resetting client...')
      return NextResponse.json(
        { error: 'Database connection reset, please try again', code: 'PREPARED_STATEMENT_CONFLICT' },
        { status: 503 }
      )
    }
    
    // Check if it's a database connection issue
    if (error?.code === 'P1001' || error?.message?.includes('connection') || error?.message?.includes('timeout')) {
      console.error('🔌 Database connection issue in cards update')
      return NextResponse.json(
        { error: 'Database temporarily unavailable', code: 'DB_CONNECTION_ERROR' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update cards', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 