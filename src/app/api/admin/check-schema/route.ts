import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to query a CategoryReward with the new portal bonus fields
    const testQuery = await prisma.categoryReward.findFirst({
      select: {
        id: true,
        rewardRate: true,
        hasPortalBonus: true,
        portalRewardRate: true,
        portalDescription: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Portal bonus fields exist in database',
      sampleRecord: testQuery,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Portal bonus fields do not exist in database - migration needed',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
} 