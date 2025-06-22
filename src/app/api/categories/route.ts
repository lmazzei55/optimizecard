import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  let client
  try {
    // Use PostgreSQL client directly to avoid Prisma prepared statement conflicts
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    
    client = await pool.connect()
    
    const result = await client.query(`
      SELECT id, name, description, "createdAt"
      FROM "SpendingCategory"
      ORDER BY name ASC
    `)
    
    const categories = result.rows
    
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
    
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error?.message || 'Unknown error' },
      { status: 503 }
    )
  } finally {
    if (client) {
      client.release()
    }
  }
} 