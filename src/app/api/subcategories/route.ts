import { NextResponse } from 'next/server'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // First try to get categories - this we know works
    const categories = await withRetry(async () => {
      return await prisma.spendingCategory.findMany({
        orderBy: { name: 'asc' }
      })
    })
    
    console.log(`✅ Subcategories API: Found ${categories.length} categories`)
    
    // Try to get subcategories, but handle gracefully if table doesn't exist
    let subcategoriesMap = new Map()
    try {
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
    } catch (subError: any) {
      console.warn('⚠️ Subcategories table not accessible, using categories only:', subError?.message || 'Unknown error')
      // If subcategories fail, we'll return categories with empty subcategories arrays
    }
    
    // Build the response with categories and their subcategories
    const categoriesWithSubcategories = categories.map(category => ({
      ...category,
      subCategories: subcategoriesMap.get(category.id) || []
    }))
    
    return NextResponse.json(categoriesWithSubcategories)
  } catch (error: any) {
    console.error('❌ Subcategories API Error:', error)
    
    // Return fallback data to prevent breaking the app
    const fallbackCategories = [
      {
        id: '1',
        name: 'Dining',
        description: 'Restaurants and food',
        subCategories: [
          { id: 'sub1', name: 'Coffee Shops', description: 'Coffee shops and cafes' },
          { id: 'sub2', name: 'Fast Food', description: 'Fast food restaurants' }
        ]
      },
      {
        id: '2', 
        name: 'Travel',
        description: 'Travel and transportation',
        subCategories: []
      },
      {
        id: '3',
        name: 'Entertainment', 
        description: 'Entertainment and recreation',
        subCategories: [
          { id: 'sub3', name: 'Streaming', description: 'Video and music streaming services' }
        ]
      }
    ]
    
    console.log('Returning fallback subcategories data')
    return NextResponse.json(fallbackCategories, { 
      status: 200,
      headers: { 'X-Fallback-Data': 'true' }
    })
  }
} 