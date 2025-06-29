import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Testing cards table access...')
    
    // Try to count cards
    const cardCount = await prisma.creditCard.count()
    console.log(`✅ Successfully accessed creditCard table. Found ${cardCount} cards.`)
    
    // Try to fetch first 3 cards
    const sampleCards = await prisma.creditCard.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        issuer: true
      }
    })
    
    return NextResponse.json({
      success: true,
      cardCount,
      sampleCards,
      databaseUrl: process.env.DIRECT_DATABASE_URL ? 'Using DIRECT_DATABASE_URL' : 'Using DATABASE_URL'
    })
    
  } catch (error: any) {
    console.error('❌ Cards table test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      databaseUrl: process.env.DIRECT_DATABASE_URL ? 'Using DIRECT_DATABASE_URL' : 'Using DATABASE_URL'
    }, { status: 500 })
  }
} 