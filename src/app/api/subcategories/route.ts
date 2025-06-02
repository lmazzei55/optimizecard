import { NextResponse } from 'next/server'
import { withRetry } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Use the retry logic and safer approach
    const categoriesWithSubcategories = await withRetry(async () => {
      try {
        // Try to fetch categories with subcategories
        return await prisma.spendingCategory.findMany({
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
      } catch (relationError) {
        console.warn('Subcategories relation not available, falling back to separate queries')
        
        // Fallback: get categories and subcategories separately
        const [categories, subCategories] = await Promise.all([
          prisma.spendingCategory.findMany({
            orderBy: { name: 'asc' }
          }),
          prisma.subCategory.findMany({
            include: {
              parentCategory: true
            },
            orderBy: { name: 'asc' }
          })
        ])
        
        // Manually group subcategories under their parent categories
        return categories.map(category => ({
          ...category,
          subCategories: subCategories.filter(sub => sub.parentCategoryId === category.id)
        }))
      }
    })
    
    console.log(`✅ Subcategories API: Found ${categoriesWithSubcategories.length} categories with subcategories`)
    
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