import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/cards/[id] - Get specific card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const card = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        categoryRewards: {
          include: {
            category: true,
          },
        },
        benefits: true,
      },
    })

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: card,
    })
  } catch (error) {
    console.error('Error fetching card:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch card' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/cards/[id] - Update card
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      issuer,
      annualFee,
      baseReward,
      rewardType,
      pointValue,
      signupBonus,
      signupSpend,
      signupTimeframe,
      isActive,
      categoryRewards = [],
    } = body

    // Check if card exists
    const existingCard = await prisma.creditCard.findUnique({
      where: { id },
    })

    if (!existingCard) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      )
    }

    // Update the card
    const updatedCard = await prisma.creditCard.update({
      where: { id },
      data: {
        name: name || existingCard.name,
        issuer: issuer || existingCard.issuer,
        annualFee: annualFee !== undefined ? annualFee : existingCard.annualFee,
        baseReward: baseReward !== undefined ? baseReward : existingCard.baseReward,
        rewardType: rewardType || existingCard.rewardType,
        pointValue: pointValue !== undefined ? pointValue : existingCard.pointValue,
        signupBonus: signupBonus !== undefined ? signupBonus : existingCard.signupBonus,
        signupSpend: signupSpend !== undefined ? signupSpend : existingCard.signupSpend,
        signupTimeframe: signupTimeframe !== undefined ? signupTimeframe : existingCard.signupTimeframe,
        isActive: isActive !== undefined ? isActive : existingCard.isActive,
      },
    })

    // Update category rewards if provided
    if (categoryRewards.length > 0) {
      // Delete existing category rewards
      await prisma.categoryReward.deleteMany({
        where: { cardId: id },
      })

      // Create new category rewards
      for (const reward of categoryRewards) {
        const category = await prisma.spendingCategory.findFirst({
          where: { name: reward.categoryName },
        })

        if (category) {
          await prisma.categoryReward.create({
            data: {
              cardId: id,
              categoryId: category.id,
              rewardRate: reward.rewardRate,
              maxReward: reward.maxReward || null,
              period: reward.period || null,
            },
          })
        }
      }
    }

    // Fetch the complete updated card
    const card = await prisma.creditCard.findUnique({
      where: { id },
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
      data: card,
    })
  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cards/[id] - Delete card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if card exists
    const existingCard = await prisma.creditCard.findUnique({
      where: { id },
    })

    if (!existingCard) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      )
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.categoryReward.deleteMany({
      where: { cardId: id },
    })

    await prisma.cardBenefit.deleteMany({
      where: { cardId: id },
    })

    // Delete the card
    await prisma.creditCard.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Card deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete card' },
      { status: 500 }
    )
  }
} 