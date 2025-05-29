import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/benefits/[id] - Get specific benefit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const benefit = await prisma.cardBenefit.findUnique({
      where: { id: params.id },
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

    if (!benefit) {
      return NextResponse.json(
        { success: false, error: 'Benefit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: benefit,
    })
  } catch (error) {
    console.error('Error fetching benefit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch benefit' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/benefits/[id] - Update benefit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      annualValue,
      category,
      isRecurring,
    } = body

    // Check if benefit exists
    const existingBenefit = await prisma.cardBenefit.findUnique({
      where: { id: params.id },
    })

    if (!existingBenefit) {
      return NextResponse.json(
        { success: false, error: 'Benefit not found' },
        { status: 404 }
      )
    }

    // Update the benefit
    const updatedBenefit = await prisma.cardBenefit.update({
      where: { id: params.id },
      data: {
        name: name || existingBenefit.name,
        description: description || existingBenefit.description,
        annualValue: annualValue !== undefined ? annualValue : existingBenefit.annualValue,
        category: category || existingBenefit.category,
        isRecurring: isRecurring !== undefined ? isRecurring : existingBenefit.isRecurring,
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
      data: updatedBenefit,
    })
  } catch (error) {
    console.error('Error updating benefit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update benefit' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/benefits/[id] - Delete benefit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if benefit exists
    const existingBenefit = await prisma.cardBenefit.findUnique({
      where: { id: params.id },
    })

    if (!existingBenefit) {
      return NextResponse.json(
        { success: false, error: 'Benefit not found' },
        { status: 404 }
      )
    }

    // Delete user benefit valuations first (if any exist)
    await prisma.userBenefitValuation.deleteMany({
      where: { benefitId: params.id },
    })

    // Delete the benefit
    await prisma.cardBenefit.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Benefit deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting benefit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete benefit' },
      { status: 500 }
    )
  }
} 