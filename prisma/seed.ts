import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

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

// Subcategories Data - Updated June 2025
const SUBCATEGORIES = [
  // Online Shopping
  { name: 'Amazon', description: 'Amazon.com purchases', parent: 'Shopping' },
  { name: 'Whole Foods', description: 'Whole Foods Market', parent: 'Groceries' },
  { name: 'Walmart.com', description: 'Walmart.com purchases', parent: 'Shopping' },
  
  // Travel - Enhanced with portal vs direct booking distinctions
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
  
  // Entertainment - Expanded
  { name: 'Streaming', description: 'Video and music streaming services', parent: 'Entertainment' },
  { name: 'Prime Video', description: 'Amazon Prime Video rentals and purchases', parent: 'Entertainment' },
  { name: 'Concerts & Events', description: 'Concert tickets, sporting events, theater', parent: 'Entertainment' },
  
  // Dining - Enhanced categories
  { name: 'Fine Dining', description: 'Upscale restaurants and fine dining establishments', parent: 'Dining' },
  { name: 'Fast Food', description: 'Quick service and fast food restaurants', parent: 'Dining' },
  { name: 'Coffee Shops', description: 'Coffee shops, cafes, and specialty coffee', parent: 'Dining' },
  { name: 'Food Delivery', description: 'Food delivery services like DoorDash, Uber Eats', parent: 'Dining' },
  { name: 'Bars & Nightlife', description: 'Bars, pubs, and nightlife establishments', parent: 'Dining' },
  
  // Groceries - More specific
  { name: 'Supermarkets', description: 'Traditional grocery stores and supermarkets', parent: 'Groceries' },
  { name: 'Warehouse Clubs', description: 'Costco, Sam\'s Club, BJ\'s Wholesale', parent: 'Groceries' },
] as const

// Card Benefits Data
const CARD_BENEFITS = {
  'chase-sapphire-reserve': [
    {
      name: '$300 Annual Travel Credit',
      description: 'Automatic statement credit for travel purchases',
      annualValue: 300,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Priority Pass Lounge Access',
      description: 'Unlimited airport lounge access worldwide (Priority Pass Select)',
      annualValue: 429,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'TSA PreCheck/Global Entry Credit',
      description: '$120 credit every 4 years for application fee',
      annualValue: 30, // $120 every 4 years (updated June 2025)
      category: 'travel',
      isRecurring: true,
    },
    {
      name: '$500 The Edit Hotel Credit',
      description: 'Up to $500 annually for prepaid bookings with The Edit (Chase\'s luxury hotel collection)',
      annualValue: 500, // NEW June 2025
      category: 'travel',
      isRecurring: true,
    },
    {
      name: '$300 Dining Credit',
      description: 'Up to $300 annually at Sapphire Reserve Exclusive Tables restaurants',
      annualValue: 300, // NEW June 2025
      category: 'dining',
      isRecurring: true,
    },
    {
      name: '$300 StubHub Credit',
      description: 'Up to $300 annually for concert and event tickets on StubHub',
      annualValue: 300, // NEW June 2025
      category: 'entertainment',
      isRecurring: true,
    },
    {
      name: '$250 Apple Services Credit',
      description: 'Annual credit for Apple TV+ and Apple Music subscriptions',
      annualValue: 250, // NEW June 2025
      category: 'entertainment',
      isRecurring: true,
    },
    {
      name: '$120 Peloton Credit',
      description: 'Up to $120 annually toward Peloton memberships',
      annualValue: 120, // NEW June 2025
      category: 'fitness',
      isRecurring: true,
    },
    {
      name: 'IHG Platinum Elite Status',
      description: 'Complimentary IHG One Rewards Platinum Elite status',
      annualValue: 200, // NEW June 2025
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Primary Rental Car Insurance',
      description: 'Primary auto rental collision damage waiver worldwide',
      annualValue: 150,
      category: 'insurance',
      isRecurring: true,
    },
    {
      name: 'Trip Protection Insurance',
      description: 'Trip cancellation/interruption and baggage delay protection',
      annualValue: 100,
      category: 'insurance',
      isRecurring: true,
    },
  ],
  'capital-one-venture-x': [
    {
      name: '$300 Annual Travel Credit',
      description: 'Annual travel credit for any travel purchases',
      annualValue: 300,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Priority Pass Lounge Access',
      description: 'Unlimited airport lounge access worldwide (Priority Pass Select)',
      annualValue: 429,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'TSA PreCheck/Global Entry Credit',
      description: '$100 credit every 4 years for application fee',
      annualValue: 25,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Capital One Travel Portal Benefits',
      description: '10x miles on hotels and car rentals through Capital One Travel',
      annualValue: 75, // Conservative estimate for moderate users
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Travel Insurance',
      description: 'Trip cancellation/interruption and rental car coverage',
      annualValue: 100,
      category: 'insurance',
      isRecurring: true,
    },
  ],
  'amex-gold': [
    {
      name: '$120 Uber Cash',
      description: '$10 monthly Uber Cash for Uber rides and Uber Eats',
      annualValue: 120,
      category: 'transportation',
      isRecurring: true,
    },
    {
      name: '$120 Dining Credit',
      description: 'Up to $10 monthly at Grubhub, The Cheesecake Factory, Goldbelly, Wine.com, and Five Guys',
      annualValue: 120, // Updated June 2025
      category: 'dining',
      isRecurring: true,
    },
    {
      name: '$100 Resy Credit',
      description: 'Up to $100 annually for dining at U.S. Resy restaurants',
      annualValue: 100, // NEW June 2025
      category: 'dining',
      isRecurring: true,
    },
    {
      name: '$84 Dunkin\' Credit',
      description: 'Up to $7 monthly statement credits at U.S. Dunkin\' locations',
      annualValue: 84, // NEW June 2025
      category: 'dining',
      isRecurring: true,
    },
    {
      name: 'Hotel Collection Benefits',
      description: '$100 complimentary credit and room upgrades at The Hotel Collection properties',
      annualValue: 150,
      category: 'travel',
      isRecurring: true,
    },
  ],
  'chase-sapphire-preferred': [
    {
      name: 'Primary Rental Car Insurance',
      description: 'Primary auto rental collision damage waiver',
      annualValue: 120, // Lower value than Reserve
      category: 'insurance',
      isRecurring: true,
    },
    {
      name: 'Trip Protection Insurance',
      description: 'Trip cancellation/interruption and baggage delay protection',
      annualValue: 80,
      category: 'insurance',
      isRecurring: true,
    },
    {
      name: 'Extended Warranty Protection',
      description: 'Extends manufacturer warranty by up to 1 year',
      annualValue: 50,
      category: 'insurance',
      isRecurring: true,
    },
  ],
  'amex-platinum': [
    {
      name: '$200 Hotel Credit',
      description: 'Annual credit for prepaid Fine Hotels + Resorts or The Hotel Collection bookings',
      annualValue: 200,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: '$200 Airline Fee Credit',
      description: 'Annual credit for incidental fees with selected airline',
      annualValue: 200,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: '$189 CLEAR Credit',
      description: 'Annual credit for CLEAR membership',
      annualValue: 189,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Centurion Lounge Access',
      description: 'Access to Amex Centurion Lounges and Priority Pass Select',
      annualValue: 500, // Premium value for Centurion access
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'TSA PreCheck/Global Entry Credit',
      description: '$100 credit every 4 years for application fee',
      annualValue: 25,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Hotel Elite Status',
      description: 'Hilton Honors Gold, Marriott Bonvoy Gold Elite Status',
      annualValue: 200,
      category: 'travel',
      isRecurring: true,
    },
  ],
  'blue-cash-preferred': [
    {
      name: 'Cell Phone Protection',
      description: 'Up to $800 coverage against damage and theft when you pay your cell phone bill with the card',
      annualValue: 100, // Conservative estimate
      category: 'insurance',
      isRecurring: true,
    },
    {
      name: 'Purchase Protection',
      description: 'Coverage for eligible purchases against accidental damage or theft',
      annualValue: 75,
      category: 'insurance',
      isRecurring: true,
    },
    {
      name: 'Extended Warranty',
      description: 'Extends manufacturer warranty by up to 1 year',
      annualValue: 50,
      category: 'insurance',
      isRecurring: true,
    },
  ],
} as const

// Update the type for categoryRewards
// Now supports: { category: string, rewardRate: number, maxReward?: number, period?: string } | { subCategory: string, rewardRate: number, maxReward?: number, period?: string }

type CategoryRewardSeed =
  | { category: string; rewardRate: number; maxReward?: number; period?: string }
  | { subCategory: string; rewardRate: number; maxReward?: number; period?: string }

// Credit Cards Data
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
    categoryRewards: [
      { category: 'Dining', rewardRate: 3.0 },
      { category: 'Travel', rewardRate: 2.0 },
    ] as CategoryRewardSeed[],
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 795, // Updated June 2025 - increased from $550
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.015, // With Points Boost, up to 2¢ on select bookings
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire-reserve',
    categoryRewards: [
      { category: 'Dining', rewardRate: 3.0 },
      // Updated June 2025: Travel earning structure changed
      { category: 'Travel', rewardRate: 1.0 }, // General travel now earns 1x (reduced from 3x)
      { subCategory: 'Flights (Direct)', rewardRate: 4.0 }, // NEW: 4x on flights booked directly
      { subCategory: 'Hotels (Direct)', rewardRate: 4.0 }, // NEW: 4x on hotels booked directly
      { subCategory: 'Flights (Portal)', rewardRate: 8.0 }, // NEW: 8x on flights through Chase Travel
      { subCategory: 'Hotels (Portal)', rewardRate: 8.0 }, // NEW: 8x on hotels through Chase Travel
      { subCategory: 'Car Rental (Portal)', rewardRate: 8.0 }, // NEW: 8x on car rentals through Chase Travel
      { subCategory: 'Cruises', rewardRate: 1.0 }, // Cruises now earn base rate
      { subCategory: 'Vacation Rentals', rewardRate: 1.0 }, // Vacation rentals now earn base rate
      { subCategory: 'Transit', rewardRate: 1.0 }, // Transit now earns base rate
    ] as CategoryRewardSeed[],
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
    categoryRewards: [],
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    baseReward: 2, // 2x miles on all purchases
    rewardType: 'points' as const,
    pointValue: 0.01,
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    categoryRewards: [
      // Updated June 2025: Corrected actual earning structure
      { category: 'Travel', rewardRate: 2.0 }, // General travel earns base 2x (not 5x)
      { subCategory: 'Flights (Direct)', rewardRate: 2.0 }, // Flights booked directly earn 2x
      { subCategory: 'Hotels (Direct)', rewardRate: 5.0 }, // Hotels booked directly earn 5x
      { subCategory: 'Car Rental (Direct)', rewardRate: 5.0 }, // Car rentals booked directly earn 5x
      { subCategory: 'Hotels (Portal)', rewardRate: 10.0 }, // Hotels through portal earn 10x
      { subCategory: 'Car Rental (Portal)', rewardRate: 10.0 }, // Car rentals through portal earn 10x
      { subCategory: 'Flights (Portal)', rewardRate: 5.0 }, // Flights through portal earn 5x
      { subCategory: 'Cruises', rewardRate: 2.0 }, // Cruises earn base rate
      { subCategory: 'Vacation Rentals', rewardRate: 2.0 }, // Vacation rentals earn base rate
      { category: 'Dining', rewardRate: 2.0 }, // Dining earns base 2x
    ] as CategoryRewardSeed[],
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold',
    issuer: 'American Express',
    annualFee: 325, // Updated June 2025 - increased from $250
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.01,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    categoryRewards: [
      { category: 'Dining', rewardRate: 4.0, maxReward: 200000, period: 'yearly' }, // 4x up to $50k/year
      { category: 'Groceries', rewardRate: 4.0, maxReward: 100000, period: 'yearly' }, // 4x up to $25k/year
      { subCategory: 'Flights (Direct)', rewardRate: 3.0 }, // 3x on flights booked directly
      { subCategory: 'Hotels (Portal)', rewardRate: 2.0 }, // 2x on hotels through Amex Travel
      { subCategory: 'Car Rental (Portal)', rewardRate: 2.0 }, // 2x on car rentals through Amex Travel
      { subCategory: 'Cruises', rewardRate: 2.0 }, // 2x on cruises through Amex Travel
    ],
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
    categoryRewards: [],
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
    categoryRewards: [
      { category: 'Gas', rewardRate: 0.05, maxReward: 75, period: 'quarterly' }, // 5% up to $1,500/quarter, then 1%
    ],
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
    categoryRewards: [],
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
    categoryRewards: [
      { subCategory: 'Amazon', rewardRate: 0.05 }, // 5% on Amazon purchases - no cap
      { subCategory: 'Whole Foods', rewardRate: 0.05 }, // 5% at Whole Foods - no cap
      { category: 'Dining', rewardRate: 0.02 }, // 2% at restaurants
      { category: 'Gas', rewardRate: 0.02 }, // 2% at gas stations
      { subCategory: 'Prime Video', rewardRate: 0.05 }, // 5% on Prime Video rentals/purchases
    ] as CategoryRewardSeed[],
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
    categoryRewards: [
      { category: 'Groceries', rewardRate: 0.06, maxReward: 360, period: 'yearly' }, // 6% up to $6,000/year, then 1%
      { category: 'Gas', rewardRate: 0.03, maxReward: 180, period: 'yearly' }, // 3% up to $6,000/year, then 1%
      { subCategory: 'Streaming', rewardRate: 0.06, maxReward: 120, period: 'yearly' }, // 6% up to $2,000/year, then 1%
    ] as CategoryRewardSeed[],
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
    categoryRewards: [
      { subCategory: 'Flights (Direct)', rewardRate: 5.0 }, // 5x on flights booked directly with airlines
      { subCategory: 'Hotels (Portal)', rewardRate: 5.0 }, // 5x on hotels through Fine Hotels + Resorts or The Hotel Collection
      { subCategory: 'Car Rental (Portal)', rewardRate: 5.0 }, // 5x on car rentals through Amex Travel
    ] as CategoryRewardSeed[],
  },
] as const

async function main() {
  console.log('🌱 Starting database seed...')

  // Handle prepared statement conflicts by resetting client if needed
  try {
    // Test connection first
    await prisma.spendingCategory.count()
  } catch (error: any) {
    if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
      console.log('🔄 Prepared statement conflict detected, resetting Prisma client...')
      await prisma.$disconnect()
      // Force a new connection
      await prisma.$connect()
    }
  }

  // Create spending categories
  console.log('📝 Creating spending categories...')
  const categoryMap = new Map<string, string>()
  
  for (const category of SPENDING_CATEGORIES) {
    try {
      const created = await prisma.spendingCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      })
      categoryMap.set(category.name, created.id)
    } catch (error: any) {
      if (error?.code === '42P05') {
        console.log(`🔄 Prepared statement conflict for category ${category.name}, retrying...`)
        await prisma.$disconnect()
        await prisma.$connect()
        const created = await prisma.spendingCategory.upsert({
          where: { name: category.name },
          update: {},
          create: category,
        })
        categoryMap.set(category.name, created.id)
      } else {
        throw error
      }
    }
  }

  // Create subcategories
  console.log('📝 Creating subcategories...')
  const subCategoryMap = new Map<string, string>()
  for (const sub of SUBCATEGORIES) {
    const parentCategoryId = categoryMap.get(sub.parent)
    if (!parentCategoryId) {
      console.warn(`⚠️  Parent category ${sub.parent} not found for subcategory ${sub.name}`)
      continue
    }
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

  // Create credit cards with their benefits and rewards
  console.log('💳 Creating credit cards...')
  
  for (const cardData of CREDIT_CARDS) {
    // Create the card
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
      },
    })

    // Create category rewards
    console.log(`Creating rewards for ${cardData.name}...`)
    for (const reward of cardData.categoryRewards as CategoryRewardSeed[]) {
      try {
        if ('subCategory' in reward) {
          const subCategoryId = subCategoryMap.get(reward.subCategory)
          if (!subCategoryId) continue
          await prisma.categoryReward.create({
            data: {
              cardId: card.id,
              categoryId: null,
              subCategoryId,
              rewardRate: reward.rewardRate,
              maxReward: reward.maxReward || null,
              period: reward.period || null,
            },
          })
        } else if ('category' in reward) {
          const categoryId = categoryMap.get(reward.category)
          if (!categoryId) continue
          await prisma.categoryReward.create({
            data: {
              cardId: card.id,
              categoryId,
              subCategoryId: null,
              rewardRate: reward.rewardRate,
              maxReward: reward.maxReward || null,
              period: reward.period || null,
            },
          })
        }
      } catch (error) {
        // Skip duplicates quietly
      }
    }

    // Create card benefits
    const benefits = CARD_BENEFITS[cardData.id as keyof typeof CARD_BENEFITS]
    if (benefits) {
      for (const benefit of benefits) {
        await prisma.cardBenefit.upsert({
          where: { 
            cardId_name: { 
              cardId: card.id, 
              name: benefit.name 
            } 
          },
          update: {},
          create: {
            cardId: card.id,
            name: benefit.name,
            description: benefit.description,
            annualValue: benefit.annualValue,
            category: benefit.category,
            isRecurring: benefit.isRecurring,
          },
        })
      }
    }

    console.log(`✅ Created ${cardData.name}`)
  }

  console.log('🎯 Seeding complete! Summary:')
  console.log(`  - ${CREDIT_CARDS.length} credit cards`)
  console.log(`  - ${CREDIT_CARDS.reduce((total, card) => total + card.categoryRewards.length, 0)} category rewards`)
  console.log(`  - ${CREDIT_CARDS.reduce((total, card) => {
    const benefits = CARD_BENEFITS[card.id as keyof typeof CARD_BENEFITS]
    return total + (benefits ? benefits.length : 0)
  }, 0)} card benefits`)
  
  // Ensure test user is premium
  console.log('👤 Setting up test user...')
  await prisma.user.upsert({
    where: { email: 'leoermeyor@gmail.com' },
    update: { 
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      rewardPreference: 'points',
      pointValue: 0.01,
      enableSubCategories: true
    },
    create: {
      email: 'leoermeyor@gmail.com',
      name: 'Leonardo Mazzei',
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      rewardPreference: 'points',
      pointValue: 0.01,
      enableSubCategories: true
    }
  })
  console.log('✅ Test user set to premium')
  
  console.log('🎉 Database seeded successfully!')
  console.log(`📊 Created ${SPENDING_CATEGORIES.length} categories and ${CREDIT_CARDS.length} credit cards`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 