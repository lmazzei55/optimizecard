import { NextResponse } from 'next/server'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await withRetry(async () => {
      return await prisma.spendingCategory.findMany({
        orderBy: {
          name: 'asc'
        }
      })
    })
    
    console.log(`✅ Categories API: Found ${categories.length} categories`)
    
    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('❌ Categories API Error:', error)
    
    // If it's a connection error, return a more specific error with fallback data
    if (error?.code === 'P2010' || error?.message?.includes('prepared statement') || error?.message?.includes('connection')) {
      console.error('Database connection pool issue detected')
      
      // Return fallback categories to keep the app functional
      const fallbackCategories = [
        { id: '1', name: 'Dining', icon: '🍽️' },
        { id: '2', name: 'Travel', icon: '✈️' },
        { id: '3', name: 'Gas', icon: '⛽' },
        { id: '4', name: 'Groceries', icon: '🛒' },
        { id: '5', name: 'Online Shopping', icon: '🛍️' },
        { id: '6', name: 'Entertainment', icon: '🎬' },
        { id: '7', name: 'Other', icon: '💳' }
      ]
      
      return NextResponse.json(fallbackCategories, { 
        status: 200,
        headers: { 'X-Fallback-Data': 'true' }
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 