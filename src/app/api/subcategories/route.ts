import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // First test if we can connect to the database
    await prisma.$queryRawUnsafe('SELECT 1')
    
    // Fetch categories with their subcategories
    const categoriesWithSubcategories = await prisma.spendingCategory.findMany({
      include: {
        subCategories: {
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`✅ Subcategories API: Found ${categoriesWithSubcategories.length} categories with subcategories`)
    
    return NextResponse.json(categoriesWithSubcategories)
  } catch (error: any) {
    console.error('❌ Subcategories API Error:', error)
    
    // If it's a connection error, return a more specific error
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement')) {
      console.error('Database connection pool issue detected')
      return NextResponse.json(
        { error: 'Database connection issue', code: 'DB_POOL_ERROR' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch subcategories', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 