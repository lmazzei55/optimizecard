import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Basic credit cards data
const creditCards = [
  // Chase Cards
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited®',
    issuer: 'Chase',
    annualFee: 0,
    rewardType: 'cashback',
    baseReward: 0.015, // 1.5%
    applicationUrl: 'https://creditcards.chase.com/freedom-credit-cards/unlimited',
    isActive: true
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred® Card',
    issuer: 'Chase',
    annualFee: 95,
    rewardType: 'points',
    baseReward: 0.01, // 1x points
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    isActive: true
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve®',
    issuer: 'Chase',
    annualFee: 550,
    rewardType: 'points',
    baseReward: 0.01, // 1x points
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
    isActive: true
  },
  
  // American Express Cards
  {
    id: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday® Card from American Express',
    issuer: 'American Express',
    annualFee: 0,
    rewardType: 'cashback',
    baseReward: 0.01, // 1%
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/',
    isActive: true
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred® Card from American Express',
    issuer: 'American Express',
    annualFee: 95,
    rewardType: 'cashback',
    baseReward: 0.01, // 1%
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/',
    isActive: true
  },
  {
    id: 'amex-gold',
    name: 'American Express® Gold Card',
    issuer: 'American Express',
    annualFee: 250,
    rewardType: 'points',
    baseReward: 0.01, // 1x points
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    isActive: true
  },
  {
    id: 'amex-platinum',
    name: 'The Platinum Card® from American Express',
    issuer: 'American Express',
    annualFee: 695,
    rewardType: 'points',
    baseReward: 0.01, // 1x points
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
    isActive: true
  },
  
  // Capital One Cards
  {
    id: 'capital-one-venture',
    name: 'Capital One Venture Rewards Credit Card',
    issuer: 'Capital One',
    annualFee: 95,
    rewardType: 'points',
    baseReward: 0.02, // 2x points
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture/',
    isActive: true
  },
  {
    id: 'capital-one-savor',
    name: 'Capital One Savor Cash Rewards Credit Card',
    issuer: 'Capital One',
    annualFee: 95,
    rewardType: 'cashback',
    baseReward: 0.01, // 1%
    applicationUrl: 'https://www.capitalone.com/credit-cards/savor-dining-rewards/',
    isActive: true
  },
  
  // Citi Cards
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash® Card',
    issuer: 'Citi',
    annualFee: 0,
    rewardType: 'cashback',
    baseReward: 0.02, // 2%
    applicationUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
    isActive: true
  },
  {
    id: 'citi-custom-cash',
    name: 'Citi Custom Cash® Card',
    issuer: 'Citi',
    annualFee: 0,
    rewardType: 'cashback',
    baseReward: 0.01, // 1%
    applicationUrl: 'https://www.citi.com/credit-cards/citi-custom-cash-credit-card',
    isActive: true
  },
  
  // Discover Card
  {
    id: 'discover-it-cash-back',
    name: 'Discover it® Cash Back',
    issuer: 'Discover',
    annualFee: 0,
    rewardType: 'cashback',
    baseReward: 0.01, // 1%
    applicationUrl: 'https://www.discover.com/credit-cards/cash-back/',
    isActive: true
  },
  
  // Wells Fargo Card
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash® Card',
    issuer: 'Wells Fargo',
    annualFee: 0,
    rewardType: 'cashback',
    baseReward: 0.02, // 2%
    applicationUrl: 'https://creditcards.wellsfargo.com/active-cash-credit-card/',
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
    
    // Only allow admin users (you can add your email here)
    const adminEmails = ['lmazzei.work@gmail.com', 'lmazzeiucd@gmail.com', 'optimizecard@gmail.com']
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('🌱 Starting credit card seeding...')
    
    // Check if cards already exist
    const existingCount = await prisma.creditCard.count()
    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Credit cards already exist in database',
        count: existingCount
      })
    }
    
    // Create all cards
    const results = []
    for (const card of creditCards) {
      try {
        const created = await prisma.creditCard.create({
          data: card
        })
        results.push({ success: true, card: created.name })
        console.log(`✅ Created: ${created.name}`)
      } catch (error: any) {
        console.error(`❌ Failed to create ${card.name}:`, error.message)
        results.push({ success: false, card: card.name, error: error.message })
      }
    }
    
    // Get final count
    const finalCount = await prisma.creditCard.count()
    
    return NextResponse.json({
      success: true,
      message: `Seeded ${finalCount} credit cards`,
      results,
      totalCards: finalCount
    })
    
  } catch (error: any) {
    console.error('❌ Seed error:', error)
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
    const cards = await prisma.creditCard.findMany({
      select: {
        id: true,
        name: true,
        issuer: true,
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