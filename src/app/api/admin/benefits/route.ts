import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/benefits - List all benefits
export async function GET() {
  try {
    const benefits = await prisma.cardBenefit.findMany({
      include: {
        card: {
          select: {
            id: true,
            name: true,
            issuer: true,
          },
        },
      },
      orderBy: [
        { card: { name: 'asc' } },
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: benefits,
    })
  } catch (error) {
    console.error('Error fetching benefits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch benefits' },
      { status: 500 }
    )
  }
}

// POST /api/admin/benefits - Create new benefit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cardId,
      name,
      description,
      annualValue,
      category,
      isRecurring,
    } = body

    // Validate required fields
    if (!cardId || !name || !description || annualValue === undefined || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if card exists
    const card = await prisma.creditCard.findUnique({
      where: { id: cardId },
    })

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      )
    }

    // Check if benefit with same name already exists for this card
    const existingBenefit = await prisma.cardBenefit.findFirst({
      where: {
        cardId,
        name,
      },
    })

    if (existingBenefit) {
      return NextResponse.json(
        { success: false, error: 'Benefit with this name already exists for this card' },
        { status: 409 }
      )
    }

    // Create the benefit
    const benefit = await prisma.cardBenefit.create({
      data: {
        cardId,
        name,
        description,
        annualValue,
        category,
        isRecurring: isRecurring !== undefined ? isRecurring : true,
      },
      include: {
        card: {
          select: {
            id: true,
            name: true,
            issuer: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: benefit,
    })
  } catch (error) {
    console.error('Error creating benefit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create benefit' },
      { status: 500 }
    )
  }
} 