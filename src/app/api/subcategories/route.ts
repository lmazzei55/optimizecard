import { NextResponse } from 'next/server'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // First try to get categories - this we know works
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
    
    console.log(`✅ Subcategories API: Found ${categories.length} categories`)
    
    // Try to get subcategories with proper retry handling
    let subcategoriesMap = new Map()
    
    const subcategories = await withRetry(async () => {
      return await prisma.subCategory.findMany({
        orderBy: { name: 'asc' }
      })
    })
    
    // Group subcategories by parent
    subcategories.forEach(sub => {
      if (!subcategoriesMap.has(sub.parentCategoryId)) {
        subcategoriesMap.set(sub.parentCategoryId, [])
      }
      subcategoriesMap.get(sub.parentCategoryId).push(sub)
    })
    
    console.log(`✅ Subcategories API: Found ${subcategories.length} subcategories`)
    
    // Build the response with categories and their subcategories
    const categoriesWithSubcategories = categories.map(category => ({
      ...category,
      subCategories: subcategoriesMap.get(category.id) || []
    }))
    
    return NextResponse.json(categoriesWithSubcategories)
  } catch (error: any) {
    console.error('❌ Subcategories API Error:', error)
    
    // Check if it's a prepared statement conflict
    if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
      console.log('🔄 Prepared statement conflict, attempting client reset...')
      try {
        // Try to reset the client and retry once
        const { resetPrismaClient } = await import('@/lib/prisma')
        await resetPrismaClient()
        
        // Retry the full operation once
        const categories = await prisma.spendingCategory.findMany()
        
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
          
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
          }
          
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          
          return a.name.localeCompare(b.name)
        })
        
        const subcategories = await prisma.subCategory.findMany({
          orderBy: { name: 'asc' }
        })
        
        // Group subcategories by parent
        const subcategoriesMap = new Map()
        subcategories.forEach(sub => {
          if (!subcategoriesMap.has(sub.parentCategoryId)) {
            subcategoriesMap.set(sub.parentCategoryId, [])
          }
          subcategoriesMap.get(sub.parentCategoryId).push(sub)
        })
        
        console.log(`✅ Subcategories API (after reset): Found ${categories.length} categories, ${subcategories.length} subcategories`)
        
        const categoriesWithSubcategories = categories.map(category => ({
          ...category,
          subCategories: subcategoriesMap.get(category.id) || []
        }))
        
        return NextResponse.json(categoriesWithSubcategories)
      } catch (retryError) {
        console.error('❌ Retry after reset failed:', retryError)
      }
    }
    
    // For other errors, return proper error response
    return NextResponse.json(
      { error: 'Failed to fetch subcategories', details: error?.message || 'Unknown error' },
      { status: 503 }
    )
  }
} 