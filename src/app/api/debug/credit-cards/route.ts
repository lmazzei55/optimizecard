import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.creditCard.count()
    const cards = await prisma.creditCard.findMany({
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
    
    return NextResponse.json({
      count,
      sample: cards,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 