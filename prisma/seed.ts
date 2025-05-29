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

// Card Benefits Data
const CARD_BENEFITS = {
  'chase-sapphire-reserve': [
    {
      name: 'Travel Credit',
      description: '$300 annual travel credit for travel purchases',
      annualValue: 300,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Priority Pass Lounge Access',
      description: 'Unlimited Priority Pass lounge access worldwide',
      annualValue: 429, // Value of Priority Pass Select membership
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'TSA PreCheck/Global Entry Credit',
      description: '$100 credit for TSA PreCheck or Global Entry application',
      annualValue: 20, // Amortized over 5 years
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Primary Rental Car Insurance',
      description: 'Primary auto rental collision damage waiver',
      annualValue: 150, // Estimated value
      category: 'insurance',
      isRecurring: true,
    },
  ],
  'capital-one-venture-x': [
    {
      name: 'Travel Credit',
      description: '$300 annual travel credit for travel purchases',
      annualValue: 300,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Priority Pass Lounge Access',
      description: 'Unlimited Priority Pass lounge access worldwide',
      annualValue: 429,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'TSA PreCheck/Global Entry Credit',
      description: '$100 credit for TSA PreCheck or Global Entry application',
      annualValue: 20,
      category: 'travel',
      isRecurring: true,
    },
    {
      name: 'Capital One Travel Portal Bonus',
      description: '5x miles on hotel and rental car bookings through Capital One Travel',
      annualValue: 100, // Estimated value for moderate users
      category: 'travel',
      isRecurring: true,
    },
  ],
  'amex-gold': [
    {
      name: 'Dining Credit',
      description: '$120 annual Uber Cash ($10 monthly) for Uber rides and Uber Eats',
      annualValue: 120,
      category: 'dining',
      isRecurring: true,
    },
    {
      name: 'Entertainment Credit',
      description: '$120 annual Entertainment Credit for eligible streaming subscriptions',
      annualValue: 120,
      category: 'entertainment',
      isRecurring: true,
    },
    {
      name: 'Hotel Status',
      description: 'Hilton Honors Gold Status and Marriott Bonvoy Gold Elite Status',
      annualValue: 200, // Estimated value
      category: 'travel',
      isRecurring: true,
    },
  ],
  'chase-sapphire-preferred': [
    {
      name: 'Primary Rental Car Insurance',
      description: 'Primary auto rental collision damage waiver',
      annualValue: 150,
      category: 'insurance',
      isRecurring: true,
    },
    {
      name: 'Trip Protection',
      description: 'Trip cancellation and interruption insurance',
      annualValue: 100,
      category: 'insurance',
      isRecurring: true,
    },
  ],
} as const

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
    categoryRewards: [
      { category: 'Dining', rewardRate: 3.0 },
      { category: 'Travel', rewardRate: 2.0 },
    ],
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
    categoryRewards: [
      { category: 'Dining', rewardRate: 3.0 },
      { category: 'Travel', rewardRate: 3.0 },
    ],
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
    categoryRewards: [],
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
    categoryRewards: [
      { category: 'Gas', rewardRate: 5.0, maxReward: 75, period: 'quarterly' },
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
    categoryRewards: [],
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

  // Create credit cards with their benefits and rewards
  console.log('💳 Creating credit cards...')
  
  for (const cardData of CREDIT_CARDS) {
    // Create the card
    const card = await prisma.creditCard.upsert({
      where: { id: cardData.id },
      update: {},
      create: {
        id: cardData.id,
        name: cardData.name,
        issuer: cardData.issuer,
        annualFee: cardData.annualFee,
        baseReward: cardData.baseReward,
        rewardType: cardData.rewardType,
        pointValue: cardData.pointValue,
        signupBonus: cardData.signupBonus,
        signupSpend: cardData.signupSpend,
        signupTimeframe: cardData.signupTimeframe,
      },
    })

    // Create category rewards
    for (const reward of cardData.categoryRewards) {
      const categoryId = categoryMap.get(reward.category)
      if (!categoryId) {
        console.warn(`⚠️  Category ${reward.category} not found for card ${cardData.name}`)
        continue
      }

      await prisma.categoryReward.upsert({
        where: { cardId_categoryId: { cardId: card.id, categoryId } },
        update: {},
        create: {
          cardId: card.id,
          categoryId,
          rewardRate: reward.rewardRate,
          maxReward: (reward as any).maxReward || null,
          period: (reward as any).period || null,
        },
      })
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

    console.log(`  ✅ Created ${cardData.name} with ${cardData.categoryRewards.length} category rewards and ${benefits?.length || 0} benefits`)
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