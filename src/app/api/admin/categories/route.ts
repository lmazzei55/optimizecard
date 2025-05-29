import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/categories - List all categories
export async function GET() {
  try {
    const categories = await prisma.spendingCategory.findMany({
      include: {
        _count: {
          select: {
            categoryRewards: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if category with same name already exists
    const existingCategory = await prisma.spendingCategory.findFirst({
      where: { name },
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    // Create the category
    const category = await prisma.spendingCategory.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
} 