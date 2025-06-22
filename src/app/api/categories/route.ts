import { NextResponse } from 'next/server'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await withRetry(async () => {
      return await prisma.spendingCategory.findMany()
    })
    
    // Order by importance (most common spending categories first)
    const categoryOrder = [
      'Dining',
      'Groceries', 
      'Gas',
      'Travel',
      'Entertainment',
      'Shopping',
      'Transportation',
      'Financial',
      'Utilities',
      'Other',
      'Bonus',
      'Insurance'
    ]
    
    categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.name)
      const bIndex = categoryOrder.indexOf(b.name)
      
      // If both categories are in the order list, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the list, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // If neither is in the list, sort alphabetically
      return a.name.localeCompare(b.name)
    })
    
    console.log(`✅ Categories API: Found ${categories.length} categories`)
    
    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('❌ Categories API Error:', error)
    
    // Check if it's a prepared statement conflict
    if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
      console.log('🔄 Prepared statement conflict in categories, attempting client reset...')
      try {
        // Try to reset the client and retry once
        const { resetPrismaClient } = await import('@/lib/prisma')
        await resetPrismaClient()
        
        // Retry the operation once
        const categories = await prisma.spendingCategory.findMany({
          orderBy: { name: 'asc' }
        })
        
        console.log(`✅ Categories API: Found ${categories.length} categories after reset`)
        return NextResponse.json(categories)
      } catch (retryError) {
        console.error('❌ Retry after reset failed:', retryError)
      }
    }
    
    // For other errors, return proper error response
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error?.message || 'Unknown error' },
      { status: 503 }
    )
  }
} 