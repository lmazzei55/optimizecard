import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/cards - List all cards with their relationships
export async function GET() {
  try {
    const cards = await prisma.creditCard.findMany({
      include: {
        categoryRewards: {
          include: {
            category: true,
          },
        },
        benefits: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: cards,
    })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

// POST /api/admin/cards - Create new card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      issuer,
      annualFee,
      baseReward,
      rewardType,
      pointValue,
      signupBonus,
      signupSpend,
      signupTimeframe,
      categoryRewards = [],
    } = body

    // Validate required fields
    if (!id || !name || !issuer || baseReward === undefined || !rewardType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rewardType
    if (!['cashback', 'points'].includes(rewardType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reward type' },
        { status: 400 }
      )
    }

    // Check if card already exists
    const existingCard = await prisma.creditCard.findUnique({
      where: { id },
    })

    if (existingCard) {
      return NextResponse.json(
        { success: false, error: 'Card with this ID already exists' },
        { status: 409 }
      )
    }

    // Create the card
    const card = await prisma.creditCard.create({
      data: {
        id,
        name,
        issuer,
        annualFee: annualFee || 0,
        baseReward,
        rewardType,
        pointValue: pointValue || null,
        signupBonus: signupBonus || null,
        signupSpend: signupSpend || null,
        signupTimeframe: signupTimeframe || null,
        isActive: true,
      },
    })

    // Create category rewards if provided
    if (categoryRewards.length > 0) {
      for (const reward of categoryRewards) {
        // Find category by name
        const category = await prisma.spendingCategory.findFirst({
          where: { name: reward.categoryName },
        })

        if (category) {
          await prisma.categoryReward.create({
            data: {
              cardId: card.id,
              categoryId: category.id,
              rewardRate: reward.rewardRate,
              maxReward: reward.maxReward || null,
              period: reward.period || null,
            },
          })
        }
      }
    }

    // Fetch the complete card with relationships
    const createdCard = await prisma.creditCard.findUnique({
      where: { id: card.id },
      include: {
        categoryRewards: {
          include: {
            category: true,
          },
        },
        benefits: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: createdCard,
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create card' },
      { status: 500 }
    )
  }
} 