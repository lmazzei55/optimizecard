import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Simple credit cards without complex relationships
const SIMPLE_CARDS = [
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    baseReward: 0.015,
    rewardType: 'cashback',
    applicationUrl: 'https://creditcards.chase.com/freedom-credit-cards/unlimited',
    isActive: true
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash Card',
    issuer: 'Citi',
    annualFee: 0,
    baseReward: 0.02,
    rewardType: 'cashback',
    applicationUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
    isActive: true
  },
  {
    id: 'discover-it-cash-back',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    annualFee: 0,
    baseReward: 0.01,
    rewardType: 'cashback',
    applicationUrl: 'https://www.discover.com/credit-cards/cash-back/it-card.html',
    isActive: true
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    baseReward: 1,
    rewardType: 'points',
    pointValue: 0.0125,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    isActive: true
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 550,
    baseReward: 1,
    rewardType: 'points',
    pointValue: 0.015,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
    isActive: true
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    baseReward: 2,
    rewardType: 'points',
    pointValue: 0.01,
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    isActive: true
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    annualFee: 250,
    baseReward: 1,
    rewardType: 'points',
    pointValue: 0.01,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    isActive: true
  },
  {
    id: 'amex-platinum',
    name: 'The Platinum Card from American Express',
    issuer: 'American Express',
    annualFee: 695,
    baseReward: 1,
    rewardType: 'points',
    pointValue: 0.01,
    signupBonus: 80000,
    signupSpend: 6000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
    isActive: true
  },
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash Card',
    issuer: 'Wells Fargo',
    annualFee: 0,
    baseReward: 0.02,
    rewardType: 'cashback',
    applicationUrl: 'https://www.wellsfargo.com/credit-cards/active-cash/',
    isActive: true
  },
  {
    id: 'blue-cash-preferred',
    name: 'Blue Cash Preferred Card from American Express',
    issuer: 'American Express',
    annualFee: 95,
    baseReward: 0.01,
    rewardType: 'cashback',
    signupBonus: 350,
    signupSpend: 3000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/',
    isActive: true
  },
  {
    id: 'amazon-prime-visa',
    name: 'Amazon Prime Rewards Visa Signature Card',
    issuer: 'Chase',
    annualFee: 0,
    baseReward: 0.01,
    rewardType: 'cashback',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    applicationUrl: 'https://www.chase.com/personal/credit-cards/amazon-rewards',
    isActive: true
  }
]

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only allow admin users
    const adminEmails = ['lmazzei.work@gmail.com', 'lmazzeiucd@gmail.com', 'optimizecard@gmail.com']
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('🌱 Starting simple credit card seeding...')
    
    // Check if cards already exist
    const existingCount = await prisma.creditCard.count()
    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Credit cards already exist in database',
        count: existingCount
      })
    }
    
    // Create cards one by one with error handling
    const results = []
    for (const cardData of SIMPLE_CARDS) {
      try {
        const created = await prisma.creditCard.create({
          data: cardData
        })
        results.push({ success: true, card: created.name })
        console.log(`✅ Created: ${created.name}`)
      } catch (error: any) {
        console.error(`❌ Failed to create ${cardData.name}:`, error.message)
        results.push({ success: false, card: cardData.name, error: error.message })
      }
    }
    
    // Get final count
    const finalCount = await prisma.creditCard.count()
    
    return NextResponse.json({
      success: true,
      message: `Simple seed completed: ${finalCount} credit cards`,
      results,
      totalCards: finalCount
    })
    
  } catch (error: any) {
    console.error('❌ Simple seed error:', error)
    return NextResponse.json({
      error: 'Failed to seed credit cards',
      details: error.message
    }, { status: 500 })
  }
}

// GET method to check current status
export async function GET() {
  try {
    const count = await prisma.creditCard.count()
    
    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: 'No credit cards found - database is empty',
        count: 0
      })
    }
    
    const cards = await prisma.creditCard.findMany({
      select: {
        id: true,
        name: true,
        issuer: true,
        annualFee: true,
        isActive: true
      },
      orderBy: [
        { issuer: 'asc' },
        { name: 'asc' }
      ]
    })
    
    return NextResponse.json({
      success: true,
      count,
      cards
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to fetch cards',
      details: error.message
    }, { status: 500 })
  }
} 