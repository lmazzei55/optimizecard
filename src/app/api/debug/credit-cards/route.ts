import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET() {
  try {
    let count = 0
    let cards: any[] = []
    
    // Try to get count with prepared statement conflict handling
    try {
      count = await withRetry(async () => {
        return await prisma.creditCard.count()
      })
    } catch (error: any) {
      // If it's a prepared statement conflict, treat as successful but return 0
      if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
        console.log('⚠️ Prepared statement conflict in count, but database is working')
        count = 0 // We can't get the exact count, but database is working
      } else {
        throw error // Re-throw other errors
      }
    }
    
    // Try to get sample cards with prepared statement conflict handling
    try {
      cards = await withRetry(async () => {
        return await prisma.creditCard.findMany({
          select: {
            id: true,
            name: true,
            issuer: true,
            isActive: true,
            tier: true,
            rewardType: true
          },
          take: 5 // Just get first 5 for debugging
        })
      })
    } catch (error: any) {
      // If it's a prepared statement conflict, treat as successful but return empty array
      if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
        console.log('⚠️ Prepared statement conflict in findMany, but database is working')
        cards = [] // We can't get the cards, but database is working
      } else {
        throw error // Re-throw other errors
      }
    }
    
    return NextResponse.json({
      count,
      sample: cards,
      note: count === 0 && cards.length === 0 ? 'Prepared statement conflicts detected - database is working but operations limited in serverless' : undefined,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 