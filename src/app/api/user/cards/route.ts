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
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
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
  } catch (error) {
    console.error('Error updating owned cards:', error)
    return NextResponse.json(
      { error: 'Failed to update owned cards' },
      { status: 500 }
    )
  }
} 