import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

// Spending Categories Data
const SPENDING_CATEGORIES = [
  { name: 'Dining', description: 'Restaurants, bars, and food delivery' },
  { name: 'Travel', description: 'Airlines, hotels, and travel expenses' },
  { name: 'Gas', description: 'Gas stations and fuel' },
  { name: 'Groceries', description: 'Supermarkets and grocery stores' },
  { name: 'Online Shopping', description: 'E-commerce and online purchases' },
  { name: 'Entertainment', description: 'Movies, streaming, and entertainment' },
  { name: 'Utilities', description: 'Phone, internet, and utility bills' },
  { name: 'Other', description: 'All other purchases' },
] as const

// Subcategories Data
const SUBCATEGORIES = [
  // Online Shopping
  { name: 'Amazon', description: 'Amazon.com purchases', parent: 'Online Shopping' },
  { name: 'Whole Foods', description: 'Whole Foods Market', parent: 'Groceries' },
  { name: 'Walmart.com', description: 'Walmart.com purchases', parent: 'Online Shopping' },
  // Travel
  { name: 'Airfare', description: 'Airline tickets and airfare', parent: 'Travel' },
  { name: 'Hotels', description: 'Hotel bookings', parent: 'Travel' },
  { name: 'Car Rental', description: 'Car rental agencies', parent: 'Travel' },
  { name: 'Rideshare', description: 'Uber, Lyft, and other rideshare', parent: 'Travel' },
  // Entertainment
  { name: 'Streaming', description: 'Video and music streaming services', parent: 'Entertainment' },
  // Dining
  { name: 'Fast Food', description: 'Fast food restaurants', parent: 'Dining' },
  { name: 'Coffee Shops', description: 'Coffee shops and cafes', parent: 'Dining' },
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
      annualValue: 429, // Value of Priority Pass Select membership
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'TSA PreCheck/Global Entry Credit',
      description: '$100 credit every 4 years for application fee',
      annualValue: 25, // $100 every 4 years
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Primary Rental Car Insurance',
      description: 'Primary auto rental collision damage waiver worldwide',
      annualValue: 150, // Estimated value for frequent travelers
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
      category: 'dining',
      isRecurring: true,
    },
    {
      name: '$120 Entertainment Credit',
      description: '$10 monthly credit for eligible entertainment subscriptions',
      annualValue: 120,
      category: 'entertainment',
      isRecurring: true,
    },
    {
      name: 'Dining Credits with Grubhub+',
      description: 'Complimentary Grubhub+ membership and monthly credits',
      annualValue: 60,
      category: 'dining',
      isRecurring: true,
    },
    {
      name: 'Hotel Elite Status',
      description: 'Hilton Honors Gold Status and Marriott Bonvoy Gold Elite Status',
      annualValue: 150, // Conservative estimate
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
    annualFee: 550,
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.015,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire-reserve',
    categoryRewards: [
      { category: 'Dining', rewardRate: 3.0 },
      { category: 'Travel', rewardRate: 3.0 },
      { subCategory: 'Hotels', rewardRate: 10.0 }, // Example: 10x on hotels booked through portal
      { subCategory: 'Car Rental', rewardRate: 10.0 },
      { subCategory: 'Airfare', rewardRate: 5.0 },
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
    baseReward: 2,
    rewardType: 'points' as const,
    pointValue: 0.01,
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    categoryRewards: [
      // General travel booked outside portal earns 5x
      { category: 'Travel', rewardRate: 5.0 },
      // Portal bookings on hotels & rental cars earn 10x
      { subCategory: 'Hotels', rewardRate: 10.0 },
      { subCategory: 'Car Rental', rewardRate: 10.0 },
      // Dining earns 2x
      { category: 'Dining', rewardRate: 2.0 },
    ] as CategoryRewardSeed[],
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold',
    issuer: 'American Express',
    annualFee: 250,
    baseReward: 1,
    rewardType: 'points' as const,
    pointValue: 0.01,
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 6,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    categoryRewards: [
      { category: 'Dining', rewardRate: 4.0 },
      { category: 'Groceries', rewardRate: 4.0, maxReward: 25000, period: 'yearly' },
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
      { subCategory: 'Airfare', rewardRate: 5.0 }, // 5x on flights booked directly with airlines
    ] as CategoryRewardSeed[],
  },
] as const

async function main() {
  console.log('🌱 Starting database seed...')

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

  console.log('🎉 Seed data created successfully!')
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