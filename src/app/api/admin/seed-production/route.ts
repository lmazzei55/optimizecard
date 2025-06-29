import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Spending Categories Data
const SPENDING_CATEGORIES = [
  { name: 'Dining', description: 'Restaurants, bars, and food delivery' },
  { name: 'Travel', description: 'Airlines, hotels, and travel expenses' },
  { name: 'Gas', description: 'Gas stations and fuel' },
  { name: 'Groceries', description: 'Supermarkets and grocery stores' },
  { name: 'Shopping', description: 'General retail and online shopping' },
  { name: 'Entertainment', description: 'Movies, streaming, and entertainment' },
  { name: 'Transportation', description: 'Public transit, rideshare, parking' },
  { name: 'Health & Medical', description: 'Doctor visits, pharmacy, medical expenses' },
  { name: 'Utilities', description: 'Phone, internet, and utility bills' },
] as const

// Subcategories Data
const SUBCATEGORIES = [
  // Online Shopping
  { name: 'Amazon', description: 'Amazon.com purchases', parent: 'Shopping' },
  { name: 'Whole Foods', description: 'Whole Foods Market', parent: 'Groceries' },
  { name: 'Walmart.com', description: 'Walmart.com purchases', parent: 'Shopping' },
  
  // Travel
  { name: 'Flights (Direct)', description: 'Flights booked directly with airlines', parent: 'Travel' },
  { name: 'Flights (Portal)', description: 'Flights booked through credit card travel portals', parent: 'Travel' },
  { name: 'Hotels (Direct)', description: 'Hotels booked directly with hotel chains', parent: 'Travel' },
  { name: 'Hotels (Portal)', description: 'Hotels booked through credit card travel portals', parent: 'Travel' },
  { name: 'Car Rental (Direct)', description: 'Car rentals booked directly with rental companies', parent: 'Travel' },
  { name: 'Car Rental (Portal)', description: 'Car rentals booked through credit card travel portals', parent: 'Travel' },
  { name: 'Cruises', description: 'Cruise bookings and cruise lines', parent: 'Travel' },
  { name: 'Transit', description: 'Public transportation, trains, buses', parent: 'Travel' },
  { name: 'Vacation Rentals', description: 'Airbnb, VRBO, and vacation rental platforms', parent: 'Travel' },
  { name: 'Rideshare', description: 'Uber, Lyft, and other rideshare services', parent: 'Travel' },
  
  // Entertainment
  { name: 'Streaming', description: 'Video and music streaming services', parent: 'Entertainment' },
  { name: 'Prime Video', description: 'Amazon Prime Video rentals and purchases', parent: 'Entertainment' },
  { name: 'Concerts & Events', description: 'Concert tickets, sporting events, theater', parent: 'Entertainment' },
  
  // Dining
  { name: 'Fine Dining', description: 'Upscale restaurants and fine dining establishments', parent: 'Dining' },
  { name: 'Fast Food', description: 'Quick service and fast food restaurants', parent: 'Dining' },
  { name: 'Coffee Shops', description: 'Coffee shops, cafes, and specialty coffee', parent: 'Dining' },
  { name: 'Food Delivery', description: 'Food delivery services like DoorDash, Uber Eats', parent: 'Dining' },
  { name: 'Bars & Nightlife', description: 'Bars, pubs, and nightlife establishments', parent: 'Dining' },
  
  // Groceries
  { name: 'Supermarkets', description: 'Traditional grocery stores and supermarkets', parent: 'Groceries' },
  { name: 'Warehouse Clubs', description: 'Costco, Sam\'s Club, BJ\'s Wholesale', parent: 'Groceries' },
] as const

// Simplified credit cards for production seeding
const CREDIT_CARDS = [
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.0125,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire-preferred',
    isActive: true,
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 795,
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.015,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire-reserve',
    isActive: true,
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    baseReward: 0.015,
    rewardType: 'cashback' as const,
    pointValue: null,
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    applicationUrl: 'https://creditcards.chase.com/cash-back-credit-cards/freedom-unlimited',
    isActive: true,
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    baseReward: 2,
    rewardType: 'points' as const,
    pointValue: 0.01,
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    isActive: true,
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold',
    issuer: 'American Express',
    annualFee: 325,
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.01,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    isActive: true,
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    issuer: 'Citi',
    annualFee: 0,
    baseReward: 0.02,
    rewardType: 'cashback' as const,
    pointValue: null,
    signupBonus: null,
    signupSpend: null,
    signupTimeframe: null,
    applicationUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
    isActive: true,
  },
  {
    id: 'discover-it-cash-back',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    annualFee: 0,
    baseReward: 0.01,
    rewardType: 'cashback' as const,
    pointValue: null,
    signupBonus: 0,
    signupSpend: null,
    signupTimeframe: null,
    applicationUrl: 'https://www.discover.com/credit-cards/cash-back/it-card.html',
    isActive: true,
  },
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash',
    issuer: 'Wells Fargo',
    annualFee: 0,
    baseReward: 0.02,
    rewardType: 'cashback' as const,
    pointValue: null,
    signupBonus: 200,
    signupSpend: 1000,
    signupTimeframe: 3,
    applicationUrl: 'https://www.wellsfargo.com/credit-cards/active-cash/',
    isActive: true,
  },
  {
    id: 'amazon-prime-card',
    name: 'Amazon Prime Rewards Visa',
    issuer: 'Chase',
    annualFee: 0,
    baseReward: 0.01,
    rewardType: 'cashback' as const,
    pointValue: null,
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    applicationUrl: 'https://www.chase.com/personal/credit-cards/amazon-rewards',
    isActive: true,
  },
  {
    id: 'blue-cash-preferred',
    name: 'Blue Cash Preferred',
    issuer: 'American Express',
    annualFee: 95,
    baseReward: 0.01,
    rewardType: 'cashback' as const,
    pointValue: null,
    signupBonus: 350,
    signupSpend: 3000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred-card/',
    isActive: true,
  },
  {
    id: 'amex-platinum',
    name: 'American Express Platinum',
    issuer: 'American Express',
    annualFee: 695,
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.01,
    signupBonus: 80000,
    signupSpend: 6000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/platinum-card/',
    isActive: true,
  },
] as const

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
    
    console.log('🌱 Starting production database seed...')
    
    // Check if cards already exist
    const existingCount = await prisma.creditCard.count()
    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Credit cards already exist in database',
        count: existingCount
      })
    }
    
    // Create spending categories
    console.log('📝 Creating spending categories...')
    const categoryMap = new Map<string, string>()
    
    for (const category of SPENDING_CATEGORIES) {
      const created = await prisma.spendingCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      })
      categoryMap.set(category.name, created.id)
    }
    
    // Create subcategories
    console.log('📝 Creating subcategories...')
    const subCategoryMap = new Map<string, string>()
    for (const sub of SUBCATEGORIES) {
      const parentCategoryId = categoryMap.get(sub.parent)
      if (!parentCategoryId) continue
      
      const created = await prisma.subCategory.upsert({
        where: { parentCategoryId_name: { parentCategoryId, name: sub.name } },
        update: {},
        create: {
          name: sub.name,
          description: sub.description,
          parentCategoryId,
        },
      })
      subCategoryMap.set(sub.name, created.id)
    }
    
    // Create credit cards
    console.log('💳 Creating credit cards...')
    let createdCount = 0
    
    for (const cardData of CREDIT_CARDS) {
      const card = await prisma.creditCard.upsert({
        where: { id: cardData.id },
        update: {
          name: cardData.name,
          issuer: cardData.issuer,
          annualFee: cardData.annualFee,
          applicationUrl: cardData.applicationUrl,
          baseReward: cardData.baseReward,
          rewardType: cardData.rewardType,
          pointValue: cardData.pointValue,
          signupBonus: cardData.signupBonus,
          signupSpend: cardData.signupSpend,
          signupTimeframe: cardData.signupTimeframe,
          isActive: cardData.isActive,
        },
        create: {
          id: cardData.id,
          name: cardData.name,
          issuer: cardData.issuer,
          annualFee: cardData.annualFee,
          applicationUrl: cardData.applicationUrl,
          baseReward: cardData.baseReward,
          rewardType: cardData.rewardType,
          pointValue: cardData.pointValue,
          signupBonus: cardData.signupBonus,
          signupSpend: cardData.signupSpend,
          signupTimeframe: cardData.signupTimeframe,
          isActive: cardData.isActive,
        },
      })
      
      createdCount++
      console.log(`✅ Created ${cardData.name}`)
    }
    
    const finalCount = await prisma.creditCard.count()
    
    return NextResponse.json({
      success: true,
      message: `Seeded ${createdCount} credit cards successfully`,
      totalCards: finalCount,
      categories: SPENDING_CATEGORIES.length,
      subcategories: SUBCATEGORIES.length
    })
    
  } catch (error: any) {
    console.error('❌ Seed error:', error)
    return NextResponse.json({
      error: 'Failed to seed production database',
      details: error.message
    }, { status: 500 })
  }
}

// GET method to check current status
export async function GET() {
  try {
    const cardCount = await prisma.creditCard.count()
    const categoryCount = await prisma.spendingCategory.count()
    const subCategoryCount = await prisma.subCategory.count()
    
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
      counts: {
        cards: cardCount,
        categories: categoryCount,
        subcategories: subCategoryCount
      },
      cards
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to fetch database status',
      details: error.message
    }, { status: 500 })
  }
} 