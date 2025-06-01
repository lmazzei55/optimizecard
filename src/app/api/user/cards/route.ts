import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

// GET: Fetch all available cards and user's owned cards
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userCards = await withRetry(async () => {
      return await prisma.userCard.findMany({
        where: {
          user: {
            email: session.user.email!
          }
        },
        include: {
          card: true
        }
      })
    })

    console.log(`✅ Cards API: Found ${userCards.length} cards for user`)
    
    return NextResponse.json(userCards)

  } catch (error: any) {
    console.error('❌ Cards API Error:', error)
    
    // Return 503 for database connection issues with empty array fallback
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      console.error('Database connection pool issue detected')
      return NextResponse.json(
        { error: 'Database temporarily unavailable', cards: [] },
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
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardIds } = await request.json()

    const result = await withRetry(async () => {
      // First, clear existing cards for this user
      await prisma.userCard.deleteMany({
        where: {
          user: {
            email: session.user.email!
          }
        }
      })

      // Then add the new cards
      if (cardIds && cardIds.length > 0) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! }
        })

        if (!user) {
          throw new Error('User not found')
        }

        const userCards = await prisma.userCard.createMany({
          data: cardIds.map((cardId: string) => ({
            userId: user.id,
            cardId: cardId
          }))
        })

        return userCards
      }

      return { count: 0 }
    })

    console.log(`✅ Cards updated for user: ${result.count} cards`)

    return NextResponse.json({ success: true, count: result.count })

  } catch (error: any) {
    console.error('❌ Cards Update Error:', error)
    
    // Return 503 for database connection issues
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update cards', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 