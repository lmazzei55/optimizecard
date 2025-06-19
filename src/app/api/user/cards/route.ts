import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch all available cards and user's owned cards
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
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
        applicationUrl: true,
      },
      orderBy: [
        { issuer: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get user's owned cards, auto-create if needed
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCards: {
          include: {
            card: true
          }
        }
      }
    })

    // Auto-create user if they don't exist
    if (!user) {
      console.log('❌ User not found for cards, auto-creating:', session.user.email)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          image: session.user.image,
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
      console.log('✅ Auto-created premium user for cards:', session.user.email)
    }

    const ownedCardIds = user?.ownedCards?.map(uc => uc.cardId) || []

    console.log(`✅ Cards API: Found ${allCards.length} total cards, ${ownedCardIds.length} owned by user`)
    
    return NextResponse.json({
      allCards,
      ownedCardIds
    })

  } catch (error: any) {
    console.error('❌ Cards API Error:', error)
    
    // Return fallback data for any error
    const fallbackCards = [
      { id: '1', name: 'Chase Sapphire Preferred', issuer: 'Chase', annualFee: 95, rewardType: 'points' },
      { id: '2', name: 'Citi Double Cash', issuer: 'Citi', annualFee: 0, rewardType: 'cashback' },
      { id: '3', name: 'American Express Gold', issuer: 'American Express', annualFee: 250, rewardType: 'points' }
    ]
    
    return NextResponse.json({
      allCards: fallbackCards,
      ownedCardIds: [],
      fallback: true
    }, { 
      status: 200,
      headers: { 'X-Fallback-Data': 'true' }
    })
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
    await prisma.userCard.deleteMany({
      where: {
        user: {
          email: session.user.email
        }
      }
    })

    // Add the new owned cards
    if (ownedCardIds.length > 0) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      await prisma.userCard.createMany({
        data: ownedCardIds.map(cardId => ({
          userId: user.id,
          cardId
        }))
      })
    }

    console.log(`✅ Cards updated for user: ${ownedCardIds.length} cards`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ Cards Update Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to update cards', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 