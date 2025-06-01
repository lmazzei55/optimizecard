import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch all available cards and user's owned cards
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test database connection first
    await prisma.$queryRawUnsafe('SELECT 1')

    // Get all available cards
    const allCards = await prisma.creditCard.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        issuer: true,
        annualFee: true,
        rewardType: true,
      },
      orderBy: [
        { issuer: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get user's owned cards
    const ownedCards = await prisma.userCard.findMany({
      where: { userId: session.user.id },
      select: { cardId: true }
    })

    const ownedCardIds = ownedCards.map((uc: { cardId: string }) => uc.cardId)

    return NextResponse.json({
      allCards,
      ownedCardIds
    })
  } catch (error: any) {
    console.error('Error fetching cards:', error)
    
    // If it's a database connection error, return a service unavailable error
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement')) {
      console.error('Database connection pool issue in cards API')
      return NextResponse.json(
        { error: 'Database temporarily unavailable', code: 'DB_POOL_ERROR' },
        { status: 503 }
      )
    }
    
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ownedCardIds }: { ownedCardIds: string[] } = await request.json()

    // Test database connection first
    await prisma.$queryRawUnsafe('SELECT 1')

    // Remove all existing owned cards for this user
    await prisma.userCard.deleteMany({
      where: { userId: session.user.id }
    })

    // Add the new owned cards
    if (ownedCardIds.length > 0) {
      await prisma.userCard.createMany({
        data: ownedCardIds.map(cardId => ({
          userId: session.user.id,
          cardId
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating owned cards:', error)
    
    // If it's a database connection error, return a service unavailable error
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement')) {
      console.error('Database connection pool issue in cards update API')
      return NextResponse.json(
        { error: 'Database temporarily unavailable', code: 'DB_POOL_ERROR' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update owned cards', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 